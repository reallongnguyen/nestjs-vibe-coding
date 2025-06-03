# Frontend i18n Error Handling Guidelines

## Introduction

This guide outlines how frontend applications should handle and display internationalized (i18n) error messages received from the API. Our API provides standardized error responses that include an error `code`, which is the key to enabling effective i18n.

The primary goal is to display user-friendly, translated error messages by using the `code` field from the API's error response as an i18n lookup key.

## API Error Response Structure

When an error occurs, the API returns a JSON response with a standardized structure. This structure is defined by the `ApiErrorResponseDto` and looks like this:

```json
{
  "code": "USER_NOT_FOUND", // Or e.g., "common.auth.invalid-token"
  "message": "User was not found", // Default, non-localized message
  "params": { "userId": "123" }, // Optional, for parameterized messages
  "timestamp": "2023-10-27T10:00:00.000Z"
}
```

-   `code` (string): A unique application-specific error code. **This is the most important field for i18n.**
-   `message` (string): A default, human-readable message in English. This can be used as a fallback if an i18n key is missing or during development, but **should not be directly displayed to end-users in a multilingual application.**
-   `params` (object, optional): Additional parameters related to the error. This is crucial for constructing more descriptive, parameterized error messages.
-   `timestamp` (string): ISO 8601 timestamp of when the error occurred.

## Using the `code` for Internationalization

The `code` field from the error response should be used as the key to look up the appropriate translated string in your frontend i18n library (e.g., `i18next`, `react-intl`, `vue-i18n`).

### Example i18n Message Files

Imagine you have the following structure for your translation files:

**`locales/en.json` (English)**
```json
{
  "errors": {
    "common.auth.invalid-token": "Your session has expired or is invalid. Please log in again.",
    "common.validation.failed": "Validation failed. Please check the highlighted fields.",
    "feed.generation.failed": "We couldn't load your feed right now. Please try again later.",
    "identity.user.not-found": "The requested user could not be found.",
    "identity.user.update-failed": "Failed to update user {{userId}}. Reason: {{cause}}."
  }
}
```

**`locales/es.json` (Spanish - Español)**
```json
{
  "errors": {
    "common.auth.invalid-token": "Tu sesión ha expirado o no es válida. Por favor, inicia sesión de nuevo.",
    "common.validation.failed": "La validación falló. Por favor, revisa los campos resaltados.",
    "feed.generation.failed": "No pudimos cargar tu feed en este momento. Por favor, inténtalo de nuevo más tarde.",
    "identity.user.not-found": "No se pudo encontrar el usuario solicitado.",
    "identity.user.update-failed": "No se pudo actualizar el usuario {{userId}}. Razón: {{cause}}."
  }
}
```
*Note: Error codes often follow a `module.entity.reason` or `module.reason` pattern, e.g., `identity.user.not-found`.*

### Conceptual Frontend Translation Logic

Here's a conceptual example of how you might look up and display a translated error message using a generic i18n service:

```typescript
// services/notificationService.ts (example)
// Assume 'i18nService.translate' is your method for getting translations
// and 'apiError' is the error object received from the API.

function displayApiError(apiError) {
  const { code, message: fallbackMessage, params } = apiError;

  // Construct the i18n key, often prefixed
  const i18nKey = `errors.${code}`; // Matches structure in en.json/es.json

  // Get the translated message.
  // The i18n library should handle interpolation of 'params' if the string contains placeholders.
  const translatedMessage = i18nService.translate(i18nKey, {
    defaultValue: fallbackMessage, // Use API message as fallback
    ...params, // Spread parameters for interpolation (e.g., {{userId}})
  });

  // Display the translated message to the user (e.g., via a toast notification)
  showToastNotification(translatedMessage, 'error');
}

// Example usage:
// fetch('/api/some-endpoint')
//   .then(response => {
//     if (!response.ok) {
//       return response.json().then(err => Promise.reject(err));
//     }
//     return response.json();
//   })
//   .then(data => console.log(data))
//   .catch(apiErrorResponse => {
//     // Assuming apiErrorResponse is the structured error from the API
//     displayApiError(apiErrorResponse);
//   });
```

## Discovering Error Codes

-   **Swagger Documentation:** The primary source for discovering which error codes an endpoint might return is the API's Swagger (OpenAPI) documentation. Endpoints decorated with `@ApiAppErrors` will list the possible error codes in their response sections.
-   **`ALL_APP_ERRORS` Registry:** For a comprehensive list of all defined error codes in the system, developers can refer to the `ALL_APP_ERRORS` object in `src/common/errors/error-registry.ts` in the backend codebase.

## Handling Parameterized Error Messages

Some error messages require parameters to provide context (e.g., "User {{userId}} not found"). The API includes these parameters in the optional `params` field of the error response.

**Example API Response with `params`:**
```json
{
  "code": "identity.user.update-failed",
  "message": "Failed to update user 123a-456b-789c. Reason: database connection timeout.",
  "params": {
    "userId": "123a-456b-789c",
    "cause": "database connection timeout"
  },
  "timestamp": "2023-10-27T10:05:00.000Z"
}
```

Your i18n library should support interpolation. When you call your translation function, pass the `params` object from the API response.

**i18n Message File Entry:**
```json
// en.json
{
  "errors": {
    "identity.user.update-failed": "Failed to update user {{userId}}. Reason: {{cause}}."
  }
}
```

**Frontend Logic:**
```typescript
// ...
const translatedMessage = i18nService.translate(i18nKey, {
  defaultValue: fallbackMessage,
  ...apiError.params, // e.g., { userId: "123a-456b-789c", cause: "database connection timeout" }
});
// Result for English: "Failed to update user 123a-456b-789c. Reason: database connection timeout."
// ...
```
The i18n library will replace placeholders like `{{userId}}` and `{{cause}}` with the values from the `params` object.

## Summary

-   **Always use the `code` field from the API error response as the key for i18n.**
-   Use the `message` field from the API as a fallback or for development/logging only.
-   Refer to Swagger documentation or the `ALL_APP_ERRORS` registry for available error codes.
-   Utilize the `params` field for dynamic, context-rich error messages through your i18n library's interpolation features.

By adhering to these guidelines, frontend applications can provide a consistent, user-friendly, and localized error handling experience.
```
