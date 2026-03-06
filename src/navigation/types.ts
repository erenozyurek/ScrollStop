export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  CreateAd: undefined;
  Generating: {
    jobId: string;
    productName: string;
    productDescription: string;
    tone: string;
    durationSeconds: number;
    platform: 'TikTok' | 'Instagram' | 'YouTube';
    language: 'English' | 'Turkish';
  };
  Preview: {
    projectId: string;
    videoUrl?: string | null;
    status?: 'pending' | 'processing' | 'success' | 'error';
    error?: string | null;
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
