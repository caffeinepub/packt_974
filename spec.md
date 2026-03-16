# Packt

## Overview

A smart packing list application for the Internet Computer. Users can create trips with destinations and dates, organize items into bags with weight tracking, use templates for quick setup, and get weather-based packing suggestions. All data is stored on-chain with full user ownership through Internet Identity authentication.

## Authentication

- Internet Identity required for all operations
- Anonymous access is not permitted
- User data is isolated by principal - users can only access their own trips and items
- Display name can be set for personalization

## Core Features

### Trip Management

- Create, update, and delete trips
- Trip properties:
  - Destination (required, with city search autocomplete)
  - Start date and end date
  - Latitude and longitude (from city selection)
  - Activities (optional list for item suggestions)
- Weather forecast displayed for trip dates
- Progress tracking showing packed vs total items

### Packing Items

- Create, update, and delete items within trips
- Item properties:
  - Name (required)
  - Category: Clothing, Toiletries, Electronics, Documents, Accessories, Other, or custom categories
  - Quantity (default 1)
  - Weight in grams (optional)
  - Bag assignment (optional)
  - Packed status
- Toggle packed status with single action
- Bulk add items from activity suggestions

### Bag Organization

- Create, update, and delete bags within trips
- Bag properties:
  - Name (required)
  - Weight limit in grams (optional)
- Suggested names: Carry-on, Checked, Personal, Backpack, Daypack
- Auto-fill weight limits for common bag types
- Visual weight progress bar per bag
- Warning indicators at 80% capacity
- Error indicators when over limit
- Assign and unassign items to bags

### Templates

- Create templates from scratch or save trips as templates
- Template properties:
  - Name (required)
  - Description (optional)
  - Activities (for item suggestions)
  - Items with name, category, and quantity
- Apply templates to trips to bulk-add items
- Delete templates when no longer needed

### Custom Activities

- Create and manage custom activities with suggested items
- Activity properties:
  - Name (required)
  - Suggested items (name, category, quantity)
- Predefined activities: Hiking, Beach, Business, Sightseeing, Camping, Sports, Shopping, Dining
- Activity items auto-suggested when creating trips

### Custom Categories

- Create and manage custom categories for item organization
- Category properties:
  - Name (required)
- Custom categories appear alongside default categories when adding/editing items
- Useful for specialized gear like Photography Equipment, Ski Gear, etc.

### Weather Integration

- Fetch weather forecast for trip destination and dates
- Display temperature range and conditions
- Historical weather data for dates beyond forecast range (14+ days)
- Weather icons for visual representation

## Backend Data Storage

- **Trips**: Persistent storage with owner principal, destination, dates, coordinates, and activities
- **Items**: Persistent storage with trip reference, item details, bag assignment, and packed status
- **Bags**: Persistent storage with trip reference, name, and weight limit
- **Templates**: Persistent storage with owner principal, name, description, activities, and items
- **Custom Activities**: Persistent storage with owner principal, name, and suggested items
- **Custom Categories**: Persistent storage with owner principal and name
- **Users**: Display name preferences keyed by principal
- Maintains state across canister upgrades

## Backend Operations

- All update operations require authentication
- Owner verification on all trip, item, bag, template, and activity modifications
- Input validation with descriptive error messages via Debug.trap
- Cascading deletes: deleting a trip removes all its items and bags
- Deleting a bag unassigns its items (does not delete them)

## User Interface

- Dashboard with tabs for Trips, Templates, and Customize (activities & categories)
- Trip detail page with items list and bag section
- Template detail page with item management
- Multi-step trip creation wizard with activity selection
- Item and bag creation/editing dialogs
- Template application dialog for trips
- Profile dropdown with edit name option
- Confirmation dialogs for destructive actions
- Loading states with spinners during operations

## Design System

- Clean interface with card-based layouts
- Progress indicators for packing completion
- Color-coded weight status (green, yellow, red)
- Badge indicators for bag assignments
- Responsive design for various screen sizes
- Modal-based workflows for focused interactions
- Icon-based actions with clear affordances

## Error Handling

- Authentication required errors for anonymous users
- Authorization errors for accessing others' data
- Validation errors for invalid input (empty names, invalid dates)
- Trip/item/bag/template not found errors for invalid IDs
- Network error handling for weather API calls
- Graceful degradation when weather data unavailable
