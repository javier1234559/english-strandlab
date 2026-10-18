export const globalConfig = {
  API_URL: process.env.NEXT_PUBLIC_APP_API,
  APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  MOCK_EMAIL: process.env.NEXT_PUBLIC_MOCK_EMAIL ?? "user@gmail.com",
  MOCK_PASSWORD: process.env.NEXT_PUBLIC_MOCK_PASSWORD ?? "123456",
};

export const brandConfig = {
  NAME: "English StrandLab",
  DESCRIPTION:
    "Learn. Experiment. Become Fluent. — Four-strands English learning organizer.",
  VERSION: "0.3.0",
  AUTHOR: "Meomotech",
  AUTHOR_EMAIL: "hello@meomotech.com",
  AUTHOR_URL: "https://meomotech.com",
};

export const labConfig = {
  SHEETS_WEB_APP_URL: process.env.NEXT_PUBLIC_SHEETS_WEB_APP_URL || "",
  SYNC_TOKEN: process.env.NEXT_PUBLIC_SYNC_TOKEN || "",
  GOOGLE_SHEET_URL: process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL || "",
};
