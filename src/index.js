import InterfaceComponent from "./interface.vue";

export default {
  id: "nested-json-field-editor",
  name: "Nested JSON field Editor",
  icon: "account_tree",
  description:
    "This field allows you to store and edit nested JSON data in a structured form.",
  component: InterfaceComponent,
  options: [
    {
      field: "allow_create_new_fields",
      name: "Allow create new fields",
      type: "boolean",
      required: true,
	  default: false,
      meta: {
        width: "full",
        interface: "boolean",
      },
    },
	{
		field: "allow_remove_fields",
		name: "Allow remove fields",
		type: "boolean",
		required: true,
		default: false,
		meta: {
		  width: "full",
		  interface: "boolean",
		},
	  },
    {
      field: "enable_search",
      name: "Enable search",
      type: "boolean",
      required: true,
      default: true,
      meta: {
        width: "full",
        interface: "boolean",
      },
    },
    {
      field: "readonly",
      name: "Read Only",
      type: "boolean",
      required: true,
      default: false,
      meta: {
        width: "full",
        interface: "boolean",
      },
    },
  ],
  types: ["json"],
};
