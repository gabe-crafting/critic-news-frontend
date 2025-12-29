declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly NG_APP_SUPABASE_URL?: string;
      readonly NG_APP_SUPABASE_PUBLISHABLE_KEY?: string;
    }
  }

  var process: {
    env: NodeJS.ProcessEnv;
  };
}

export {};

