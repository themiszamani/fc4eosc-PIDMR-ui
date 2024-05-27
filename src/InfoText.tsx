interface FieldInfo {
  label: string;
  info: string;
}

interface ProviderInfo {
  type: FieldInfo;
  name: FieldInfo;
  description: FieldInfo;
  regexes: FieldInfo;
  modes: FieldInfo;
  example: FieldInfo;
}

const AddEditProviderInfo: ProviderInfo = {
  type: {
    label: "Label",
    info: "This is the info text for PID Type!",
  },
  name: {
    label: "Label",
    info: "This is the info text for Name!",
  },
  description: {
    label: "Label",
    info: "This is the info text for Description!",
  },
  regexes: {
    label: "Label",
    info: "This is the info text for Regexes used!",
  },
  modes: {
    label: "Label",
    info: "This is the info text for Resolved modes!",
  },
  example: {
    label: "Label",
    info: "This is the info text for PID example!",
  },
};

export { AddEditProviderInfo };
