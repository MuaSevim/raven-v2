/**
 * Firebase ActionCodeSettings for email links and password resets.
 * Update the dynamic link domain if your Firebase project changes.
 */

export const actionCodeSettings = {
  url: "https://ravenapp.page.link/auth",
  handleCodeInApp: true,
  iOS: { bundleId: "com.muasevim.raven" },
  android: {
    packageName: "com.muasevim.raven",
    installApp: true,
    minimumVersion: "12",
  },
  dynamicLinkDomain: "ravenapp.page.link",
};
