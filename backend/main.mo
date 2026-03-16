import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

actor {
  type UserProfile = { name : Text };

  type Trip = {
    id : Nat;
    destination : Text;
    latitude : Float;
    longitude : Float;
    startDate : Int;
    endDate : Int;
    activities : [Text];
    createdAt : Int;
  };

  type Template = {
    id : Nat;
    name : Text;
    description : Text;
    activities : [Text];
    createdAt : Int;
  };

  type TemplateView = {
    id : Nat;
    name : Text;
    description : Text;
    activities : [Text];
    itemCount : Nat;
    bagCount : Nat;
    createdAt : Int;
  };

  type Bag = {
    id : Nat;
    listId : Nat;
    name : Text;
    weightLimit : ?Nat;
  };

  type PackingItem = {
    id : Nat;
    listId : Nat;
    bagId : ?Nat;
    name : Text;
    category : Text;
    packed : Bool;
    quantity : Nat;
    weight : ?Nat;
  };

  type CustomActivity = {
    id : Nat;
    name : Text;
    suggestedItems : [SuggestedItem];
  };

  type CustomCategory = {
    id : Nat;
    name : Text;
  };

  type CachedWeatherDay = {
    date : Text;
    tempMax : Float;
    tempMin : Float;
    precipitationProbability : ?Float;
    precipitationSum : ?Float;
    weatherCode : Nat;
    isHistorical : Bool;
  };

  type CachedTripWeather = {
    tripId : Nat;
    days : [CachedWeatherDay];
    hasHistoricalDays : Bool;
    cachedAt : Int;
  };

  type SuggestedItem = {
    name : Text;
    category : Text;
    quantity : Nat;
  };

  type BagFilter = { #all; #unassigned; #specific : Nat };

  var nextId : Nat = 1;

  var userProfiles : Map.Map<Principal, UserProfile> = Map.empty();
  var userTrips : Map.Map<Principal, Map.Map<Nat, Trip>> = Map.empty();
  var userTemplates : Map.Map<Principal, Map.Map<Nat, Template>> = Map.empty();
  var userBags : Map.Map<Principal, Map.Map<Nat, Bag>> = Map.empty();
  var userItems : Map.Map<Principal, Map.Map<Nat, PackingItem>> = Map.empty();
  var userActivities : Map.Map<Principal, Map.Map<Nat, CustomActivity>> = Map.empty();
  var userCategories : Map.Map<Principal, Map.Map<Nat, CustomCategory>> = Map.empty();
  var tripWeatherCache : Map.Map<Principal, Map.Map<Nat, CachedTripWeather>> = Map.empty();

  // Resource limits
  let MAX_TRIPS_PER_USER : Nat = 100;
  let MAX_TEMPLATES_PER_USER : Nat = 50;
  let MAX_ITEMS_PER_TRIP : Nat = 500;
  let MAX_BAGS_PER_TRIP : Nat = 50;
  let MAX_ACTIVITIES_PER_USER : Nat = 50;
  let MAX_ITEMS_PER_ACTIVITY : Nat = 50;
  let MAX_CATEGORIES_PER_USER : Nat = 50;

  func requireAuth(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Not authenticated");
    };
  };

  func validateFieldLength(value : Text, fieldName : Text, minLen : Nat, maxLen : Nat) {
    if (value.size() < minLen) {
      Runtime.trap(fieldName # " cannot be empty");
    };
    if (value.size() > maxLen) {
      Runtime.trap(fieldName # " too long (max " # Nat.toText(maxLen) # " characters)");
    };
  };

  func validateOptionalFieldLength(value : ?Text, fieldName : Text, maxLen : Nat) {
    switch (value) {
      case (?v) {
        if (v.size() > maxLen) {
          Runtime.trap(fieldName # " too long (max " # Nat.toText(maxLen) # " characters)");
        };
      };
      case (null) {};
    };
  };
  func genId() : Nat { let id = nextId; nextId += 1; id };

  func getMap<V>(store : Map.Map<Principal, Map.Map<Nat, V>>, user : Principal) : Map.Map<Nat, V> {
    switch (store.get(user)) {
      case (?m) { m };
      case (null) { let m = Map.empty<Nat, V>(); store.add(user, m); m };
    };
  };

  func trips(u : Principal) : Map.Map<Nat, Trip> { getMap(userTrips, u) };
  func templates(u : Principal) : Map.Map<Nat, Template> {
    getMap(userTemplates, u);
  };
  func bags(u : Principal) : Map.Map<Nat, Bag> { getMap(userBags, u) };
  func items(u : Principal) : Map.Map<Nat, PackingItem> { getMap(userItems, u) };
  func activities(u : Principal) : Map.Map<Nat, CustomActivity> {
    getMap(userActivities, u);
  };
  func categories(u : Principal) : Map.Map<Nat, CustomCategory> {
    getMap(userCategories, u);
  };
  func weatherCache(u : Principal) : Map.Map<Nat, CachedTripWeather> {
    getMap(tripWeatherCache, u);
  };

  // Count helpers for limit validation
  func countItemsForTrip(caller : Principal, tripId : Nat) : Nat {
    items(caller).values().toArray().filter(func(i) { i.listId == tripId }).size();
  };

  func countBagsForTrip(caller : Principal, tripId : Nat) : Nat {
    bags(caller).values().toArray().filter(func(b) { b.listId == tripId }).size();
  };

  func deleteContents(caller : Principal, listId : Nat) {
    for ((id, b) in bags(caller).entries().toArray().vals()) {
      if (b.listId == listId) {
        bags(caller).remove(id);
      };
    };
    for ((id, i) in items(caller).entries().toArray().vals()) {
      if (i.listId == listId) {
        items(caller).remove(id);
      };
    };
  };

  func toView(caller : Principal, t : Template) : TemplateView {
    let i = items(caller).values().toArray().filter(func(x) { x.listId == t.id });
    let b = bags(caller).values().toArray().filter(func(x) { x.listId == t.id });
    {
      id = t.id;
      name = t.name;
      description = t.description;
      activities = t.activities;
      itemCount = i.size();
      bagCount = b.size();
      createdAt = t.createdAt;
    };
  };

  func copyBagsAndItems(caller : Principal, fromId : Nat, toId : Nat) {
    let bagMap = Map.empty<Nat, Nat>();
    for (b in bags(caller).values().toArray().filter(func(x) { x.listId == fromId }).vals()) {
      let newId = genId();
      bags(caller).add(newId, { id = newId; listId = toId; name = b.name; weightLimit = b.weightLimit });
      bagMap.add(b.id, newId);
    };
    for (i in items(caller).values().toArray().filter(func(x) { x.listId == fromId }).vals()) {
      let newId = genId();
      let newBagId : ?Nat = switch (i.bagId) {
        case (?old) { bagMap.get(old) };
        case (null) { null };
      };
      items(caller).add(newId, { id = newId; listId = toId; bagId = newBagId; name = i.name; category = i.category; packed = false; quantity = i.quantity; weight = i.weight });
    };
  };

  public query ({ caller }) func getProfile() : async ?UserProfile {
    requireAuth(caller);
    userProfiles.get(caller);
  };

  public shared ({ caller }) func setProfile(name : Text) : async () {
    requireAuth(caller);
    validateFieldLength(name, "Name", 1, 100);
    userProfiles.add(caller, { name });
  };

  public shared ({ caller }) func createTrip(destination : Text, latitude : Float, longitude : Float, startDate : Int, endDate : Int, activities : [Text]) : async Nat {
    requireAuth(caller);
    if (trips(caller).size() >= MAX_TRIPS_PER_USER) {
      Runtime.trap("Maximum of " # Nat.toText(MAX_TRIPS_PER_USER) # " trips reached");
    };
    validateFieldLength(destination, "Destination", 1, 200);
    if (endDate < startDate) {
      Runtime.trap("End date must be after start date");
    };
    let id = genId();
    trips(caller).add(id, { id; destination; latitude; longitude; startDate; endDate; activities; createdAt = Time.now() });
    id;
  };

  public query ({ caller }) func getTrips() : async [Trip] {
    requireAuth(caller);
    trips(caller).values().toArray();
  };

  public query ({ caller }) func getTripById(id : Nat) : async ?Trip {
    requireAuth(caller);
    trips(caller).get(id);
  };

  public shared ({ caller }) func updateTrip(id : Nat, destination : Text, latitude : Float, longitude : Float, startDate : Int, endDate : Int, activities : [Text]) : async () {
    requireAuth(caller);
    validateFieldLength(destination, "Destination", 1, 200);
    if (endDate < startDate) {
      Runtime.trap("End date must be after start date");
    };
    switch (trips(caller).get(id)) {
      case (null) { Runtime.trap("Trip not found") };
      case (?t) {
        trips(caller).add(id, { id; destination; latitude; longitude; startDate; endDate; activities; createdAt = t.createdAt });
      };
    };
  };

  public shared ({ caller }) func deleteTrip(id : Nat) : async () {
    requireAuth(caller);
    switch (trips(caller).get(id)) {
      case (null) { Runtime.trap("Trip not found") };
      case (?_) {
        deleteContents(caller, id);
        weatherCache(caller).remove(id);
        trips(caller).remove(id);
      };
    };
  };

  public shared ({ caller }) func createTemplate(name : Text, description : Text, activities : [Text]) : async Nat {
    requireAuth(caller);
    if (templates(caller).size() >= MAX_TEMPLATES_PER_USER) {
      Runtime.trap("Maximum of " # Nat.toText(MAX_TEMPLATES_PER_USER) # " templates reached");
    };
    validateFieldLength(name, "Template name", 1, 100);
    let id = genId();
    templates(caller).add(id, { id; name; description; activities; createdAt = Time.now() });
    id;
  };

  public shared ({ caller }) func saveAsTemplate(tripId : Nat, name : Text, description : Text) : async Nat {
    requireAuth(caller);
    if (templates(caller).size() >= MAX_TEMPLATES_PER_USER) {
      Runtime.trap("Maximum of " # Nat.toText(MAX_TEMPLATES_PER_USER) # " templates reached");
    };
    validateFieldLength(name, "Template name", 1, 100);
    switch (trips(caller).get(tripId)) {
      case (null) { Runtime.trap("Trip not found") };
      case (?trip) {
        let id = genId();
        templates(caller).add(id, { id; name; description; activities = trip.activities; createdAt = Time.now() });
        copyBagsAndItems(caller, tripId, id);
        id;
      };
    };
  };

  public query ({ caller }) func getTemplates() : async [TemplateView] {
    requireAuth(caller);
    templates(caller).values().toArray().map<Template, TemplateView>(func(t) { toView(caller, t) });
  };

  public query ({ caller }) func getTemplateById(id : Nat) : async ?TemplateView {
    requireAuth(caller);
    switch (templates(caller).get(id)) {
      case (null) { null };
      case (?t) { ?toView(caller, t) };
    };
  };

  public shared ({ caller }) func applyTemplate(tripId : Nat, templateId : Nat) : async () {
    requireAuth(caller);
    if (trips(caller).get(tripId) == null) {
      Runtime.trap("Trip not found");
    };
    if (templates(caller).get(templateId) == null) {
      Runtime.trap("Template not found");
    };
    copyBagsAndItems(caller, templateId, tripId);
  };

  public shared ({ caller }) func updateTemplate(id : Nat, name : Text, description : Text, activities : [Text]) : async () {
    requireAuth(caller);
    validateFieldLength(name, "Template name", 1, 100);
    validateFieldLength(description, "Template description", 0, 500);
    switch (templates(caller).get(id)) {
      case (null) { Runtime.trap("Template not found") };
      case (?t) {
        templates(caller).add(id, { t with name; description; activities });
      };
    };
  };

  public shared ({ caller }) func deleteTemplate(id : Nat) : async () {
    requireAuth(caller);
    switch (templates(caller).get(id)) {
      case (null) { Runtime.trap("Template not found") };
      case (?_) { deleteContents(caller, id); templates(caller).remove(id) };
    };
  };

  public shared ({ caller }) func createBag(listId : Nat, name : Text, weightLimit : ?Nat) : async Nat {
    requireAuth(caller);
    if (countBagsForTrip(caller, listId) >= MAX_BAGS_PER_TRIP) {
      Runtime.trap("Maximum of " # Nat.toText(MAX_BAGS_PER_TRIP) # " bags per trip reached");
    };
    validateFieldLength(name, "Bag name", 1, 50);
    let id = genId();
    bags(caller).add(id, { id; listId; name; weightLimit });
    id;
  };

  public query ({ caller }) func getBags(listId : Nat) : async [Bag] {
    requireAuth(caller);
    bags(caller).values().toArray().filter(func(b) { b.listId == listId });
  };

  public shared ({ caller }) func updateBag(id : Nat, name : Text, weightLimit : ?Nat) : async () {
    requireAuth(caller);
    validateFieldLength(name, "Bag name", 1, 50);
    switch (bags(caller).get(id)) {
      case (null) { Runtime.trap("Bag not found") };
      case (?b) {
        bags(caller).add(id, { id; listId = b.listId; name; weightLimit });
      };
    };
  };

  public shared ({ caller }) func deleteBag(id : Nat) : async () {
    requireAuth(caller);
    switch (bags(caller).get(id)) {
      case (null) { Runtime.trap("Bag not found") };
      case (?_) {
        for ((iid, i) in items(caller).entries().toArray().vals()) {
          switch (i.bagId) {
            case (?bid) {
              if (bid == id) {
                items(caller).add(iid, { i with bagId = null : ?Nat });
              };
            };
            case (null) {};
          };
        };
        bags(caller).remove(id);
      };
    };
  };

  public shared ({ caller }) func addItem(listId : Nat, name : Text, category : Text, quantity : Nat, weight : ?Nat, bagId : ?Nat) : async Nat {
    requireAuth(caller);
    if (countItemsForTrip(caller, listId) >= MAX_ITEMS_PER_TRIP) {
      Runtime.trap("Maximum of " # Nat.toText(MAX_ITEMS_PER_TRIP) # " items per trip reached");
    };
    validateFieldLength(name, "Item name", 1, 100);
    if (quantity == 0) {
      Runtime.trap("Quantity must be at least 1");
    };
    let id = genId();
    items(caller).add(id, { id; listId; bagId; name; category; packed = false; quantity; weight });
    id;
  };

  public query ({ caller }) func getItems(listId : Nat, packedFilter : ?Bool, bagFilter : BagFilter) : async [PackingItem] {
    requireAuth(caller);
    items(caller).values().toArray().filter(
      func(i) {
        if (i.listId != listId) {
          return false;
        };
        switch (packedFilter) {
          case (null) {};
          case (?p) {
            if (i.packed != p) {
              return false;
            };
          };
        };
        switch (bagFilter) {
          case (#all) {};
          case (#unassigned) {
            if (i.bagId != null) {
              return false;
            };
          };
          case (#specific(bid)) {
            switch (i.bagId) {
              case (null) { return false };
              case (?b) {
                if (b != bid) {
                  return false;
                };
              };
            };
          };
        };
        true;
      }
    );
  };

  public shared ({ caller }) func updateItem(id : Nat, name : Text, category : Text, quantity : Nat, weight : ?Nat, bagId : ?Nat) : async () {
    requireAuth(caller);
    validateFieldLength(name, "Item name", 1, 100);
    if (quantity == 0) {
      Runtime.trap("Quantity must be at least 1");
    };
    switch (items(caller).get(id)) {
      case (null) { Runtime.trap("Item not found") };
      case (?i) {
        items(caller).add(id, { i with name; category; quantity; weight; bagId });
      };
    };
  };

  public shared ({ caller }) func togglePacked(id : Nat) : async Bool {
    requireAuth(caller);
    switch (items(caller).get(id)) {
      case (null) { Runtime.trap("Item not found") };
      case (?i) {
        let p = not i.packed;
        items(caller).add(id, { i with packed = p });
        p;
      };
    };
  };

  public shared ({ caller }) func assignToBag(itemId : Nat, bagId : ?Nat) : async () {
    requireAuth(caller);
    switch (items(caller).get(itemId)) {
      case (null) { Runtime.trap("Item not found") };
      case (?i) { items(caller).add(itemId, { i with bagId }) };
    };
  };

  public shared ({ caller }) func deleteItem(id : Nat) : async () {
    requireAuth(caller);
    switch (items(caller).get(id)) {
      case (null) { Runtime.trap("Item not found") };
      case (?_) { items(caller).remove(id) };
    };
  };

  public shared ({ caller }) func bulkAddItems(listId : Nat, newItems : [{ name : Text; category : Text; quantity : Nat; weight : ?Nat }]) : async [Nat] {
    requireAuth(caller);
    let currentCount = countItemsForTrip(caller, listId);
    if (currentCount + newItems.size() > MAX_ITEMS_PER_TRIP) {
      Runtime.trap("Maximum of " # Nat.toText(MAX_ITEMS_PER_TRIP) # " items per trip reached");
    };
    var ids : [Nat] = [];
    for (ni in newItems.vals()) {
      if (ni.name.size() > 0 and ni.quantity > 0) {
        let id = genId();
        items(caller).add(id, { id; listId; bagId = null : ?Nat; name = ni.name; category = ni.category; packed = false; quantity = ni.quantity; weight = ni.weight });
        ids := ids.concat([id]);
      };
    };
    ids;
  };

  public shared ({ caller }) func createCustomActivity(name : Text, suggestedItems : [SuggestedItem]) : async Nat {
    requireAuth(caller);
    if (activities(caller).size() >= MAX_ACTIVITIES_PER_USER) {
      Runtime.trap("Maximum of " # Nat.toText(MAX_ACTIVITIES_PER_USER) # " activities reached");
    };
    if (suggestedItems.size() > MAX_ITEMS_PER_ACTIVITY) {
      Runtime.trap("Maximum of " # Nat.toText(MAX_ITEMS_PER_ACTIVITY) # " items per activity");
    };
    validateFieldLength(name, "Activity name", 1, 100);
    let id = genId();
    activities(caller).add(id, { id; name; suggestedItems });
    id;
  };

  public query ({ caller }) func getCustomActivities() : async [CustomActivity] {
    requireAuth(caller);
    activities(caller).values().toArray();
  };

  public shared ({ caller }) func updateCustomActivity(id : Nat, name : Text, suggestedItems : [SuggestedItem]) : async () {
    requireAuth(caller);
    if (suggestedItems.size() > MAX_ITEMS_PER_ACTIVITY) {
      Runtime.trap("Maximum of " # Nat.toText(MAX_ITEMS_PER_ACTIVITY) # " items per activity");
    };
    validateFieldLength(name, "Activity name", 1, 100);
    switch (activities(caller).get(id)) {
      case (null) { Runtime.trap("Activity not found") };
      case (?_) { activities(caller).add(id, { id; name; suggestedItems }) };
    };
  };

  public shared ({ caller }) func deleteCustomActivity(id : Nat) : async () {
    requireAuth(caller);
    switch (activities(caller).get(id)) {
      case (null) { Runtime.trap("Activity not found") };
      case (?_) { activities(caller).remove(id) };
    };
  };

  // Get suggested items for multiple custom activities by their IDs
  public query ({ caller }) func getActivitySuggestedItems(activityIds : [Nat]) : async [SuggestedItem] {
    requireAuth(caller);
    let userActivities = activities(caller);
    var result : [SuggestedItem] = [];
    let seen = Map.empty<Text, Bool>();

    for (id in activityIds.vals()) {
      switch (userActivities.get(id)) {
        case (null) {};
        case (?activity) {
          for (item in activity.suggestedItems.vals()) {
            let key = item.name # "|" # item.category;
            if (seen.get(key) == null) {
              seen.add(key, true);
              result := result.concat([item]);
            };
          };
        };
      };
    };

    result;
  };

  public shared ({ caller }) func createCustomCategory(name : Text) : async Nat {
    requireAuth(caller);
    if (categories(caller).size() >= MAX_CATEGORIES_PER_USER) {
      Runtime.trap("Maximum of " # Nat.toText(MAX_CATEGORIES_PER_USER) # " categories reached");
    };
    validateFieldLength(name, "Category name", 1, 50);
    let id = genId();
    categories(caller).add(id, { id; name });
    id;
  };

  public query ({ caller }) func getCustomCategories() : async [CustomCategory] {
    requireAuth(caller);
    categories(caller).values().toArray();
  };

  public shared ({ caller }) func updateCustomCategory(id : Nat, name : Text) : async () {
    requireAuth(caller);
    validateFieldLength(name, "Category name", 1, 50);
    switch (categories(caller).get(id)) {
      case (null) { Runtime.trap("Category not found") };
      case (?_) { categories(caller).add(id, { id; name }) };
    };
  };

  public shared ({ caller }) func deleteCustomCategory(id : Nat) : async () {
    requireAuth(caller);
    switch (categories(caller).get(id)) {
      case (null) { Runtime.trap("Category not found") };
      case (?_) { categories(caller).remove(id) };
    };
  };

  // Weather cache operations
  public query ({ caller }) func getTripWeather(tripId : Nat) : async ?CachedTripWeather {
    requireAuth(caller);
    if (trips(caller).get(tripId) == null) {
      Runtime.trap("Trip not found");
    };
    weatherCache(caller).get(tripId);
  };

  public shared ({ caller }) func setTripWeather(tripId : Nat, days : [CachedWeatherDay], hasHistoricalDays : Bool) : async () {
    requireAuth(caller);
    if (trips(caller).get(tripId) == null) {
      Runtime.trap("Trip not found");
    };
    weatherCache(caller).add(
      tripId,
      {
        tripId;
        days;
        hasHistoricalDays;
        cachedAt = Time.now();
      },
    );
  };

  public shared ({ caller }) func clearTripWeather(tripId : Nat) : async () {
    requireAuth(caller);
    if (trips(caller).get(tripId) == null) {
      Runtime.trap("Trip not found");
    };
    weatherCache(caller).remove(tripId);
  };
};
