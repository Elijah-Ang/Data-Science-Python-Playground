# Export Compliance Working Notes

The current app code does not implement its own cryptographic algorithm, VPN, secure messaging, or user-authentication system. Network connections made by the web/runtime and Capacitor browser surfaces use operating-system/browser HTTPS capabilities.

The final App Store Connect encryption answer must be confirmed from the archived binary and every included native SDK. Do not treat this draft as the legal submission answer. Before upload:

1. Review the Xcode archive and dependency list for non-exempt encryption features.
2. Confirm whether the build only uses encryption provided by or within Apple's operating system and standard HTTPS/TLS libraries.
3. Record the resulting App Store Connect answer and any required documentation in the tracker.
4. Repeat the review after adding an advertising, analytics, authentication, or networking SDK.
