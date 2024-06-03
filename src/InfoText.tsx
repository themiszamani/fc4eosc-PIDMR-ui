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

interface UserInfo {
  name: FieldInfo;
  surname: FieldInfo;
  email: FieldInfo;
  role: FieldInfo;
  description: FieldInfo;
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

const PromotionRequestInfo: UserInfo = {
  name: {
    label: "Name",
    info: "Enter your first name.",
  },
  surname: {
    label: "Surname",
    info: "Enter your last name.",
  },
  email: {
    label: "Email",
    info: "Enter a valid email address.",
  },
  role: {
    label: "Role",
    info: "Specify the role you are requesting.",
  },
  description: {
    label: "Description",
    info: "Provide a brief description of why you are requesting this role.",
  },
};

export { AddEditProviderInfo, PromotionRequestInfo };
