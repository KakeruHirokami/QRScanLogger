// Amplify設定ファイル
// このファイルはAmplify CLIで自動生成される場合があります

const config = {
  api: {
    endpoints: [
      {
        name: "visitorCounter",
        endpoint: process.env.REACT_APP_API_URL || "",
      },
    ],
  },
};

export default config;
