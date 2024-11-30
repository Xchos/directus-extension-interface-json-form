# Directus JSON Form Interface

Hey there! 👋 I originally built this Directus interface to help manage i18n translations in a more user-friendly way. While working on it, I realized it could be super useful for editing any kind of nested JSON data, so I made it more generic and decided to share it with the community! It gives you a nice structured view of your JSON data that's much easier to work with than raw JSON.

![JSON Form Interface Visual](https://raw.githubusercontent.com/Xchos/directus-extension-interface-json-form/refs/heads/main/docs/image_visual.png)

## Features

- 🌳 Hierarchical view of nested JSON data
- 🔍 Search functionality to filter fields by key or value
- ➕ Add new nested fields dynamically
- 🗑️ Remove existing fields
- 🔄 Convert simple fields to nested objects
- 📝 Edit values inline
- 🔒 Read-only mode support
- 🎨 Directus theme-aware styling

## Usage

1. Create a field with type `json` in your collection
2. Select "Nested JSON Field Editor" as the interface
3. Configure the interface options according to your needs
4. Start editing your JSON data in a structured way

### Configuration Options

You can customize the interface behavior through the field settings:

![Interface Settings](https://raw.githubusercontent.com/Xchos/directus-extension-interface-json-form/refs/heads/main/docs/image_settings.png)

### Features in Detail

#### Nested Structure
- View and edit deeply nested JSON structures
- Clear visual hierarchy with indentation and grouping

#### Search Functionality
Search through both field names and values with real-time filtering:

![Search Functionality](https://raw.githubusercontent.com/Xchos/directus-extension-interface-json-form/refs/heads/main/docs/image_search.png)

- Real-time filtering as you type
- Highlights matching fields and their parent structure

#### Field Management
- Add new fields to any level of the JSON structure
- Remove existing fields with confirmation dialog
- Convert simple fields to nested objects
