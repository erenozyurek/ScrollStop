export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  CreateAd: undefined;
  Generating: {
    productName: string;
    productDescription: string;
    productUrl: string;
    audience: string[];
    tone: string;
    duration: string;
  };
  Preview: {
    projectId: string;
  };
  Pricing: undefined;
  Projects: undefined;
  CaptionGenerator: undefined;
  EditProfile: undefined;
  Terms: undefined;
  Privacy: undefined;
  Support: undefined;
  Notifications: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  CreateTab: undefined;
  ProfileTab: undefined;
};
