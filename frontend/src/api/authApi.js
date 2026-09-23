import { requestJson } from "./client";

export const authApi = {
  login: (username, password) =>
    requestJson("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      auth: false,
    }),

  signup: ({ username, password, fullName, emailAddress }) =>
    requestJson("/users", {
      method: "POST",
      body: JSON.stringify({ username, password, fullName, emailAddress }),
      auth: false,
    }),
};
