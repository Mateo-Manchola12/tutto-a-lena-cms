/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { setGlobalOptions } from "firebase-functions";
import type { Request } from "firebase-functions/https";
import { HttpsError, onCall, onRequest } from "firebase-functions/https";
import { defineSecret } from "firebase-functions/params";

if (getApps().length === 0) {
  initializeApp();
}

const githubApiKey = defineSecret("GITHUB_API_KEY");
const astroCallbackToken = defineSecret("ASTRO_CALLBACK_TOKEN");

type PublishCompletionStatus = "published" | "failed"

/**
 * Extracts the shared secret sent by the deployment workflow.
 *
 * @param {Request} request Incoming HTTP request.
 * @return {string | null} Bearer token or x-callback-token header.
 */
function getCallbackToken(request: Request): string | null {
  const authorizationHeader = request.get("authorization");

  if (authorizationHeader?.startsWith("Bearer ")) {
    return authorizationHeader.slice("Bearer ".length).trim();
  }

  return request.get("x-callback-token")?.trim() ?? null;
}

/**
 * Resolves the deployment completion status from body or query params.
 *
 * @param {Request} request Incoming HTTP request.
 * @return {PublishCompletionStatus} Final publish status.
 */
function getCompletionStatus(request: Request): PublishCompletionStatus {
  const bodyStatus = typeof request.body?.status === "string" ? request.body.status : null;
  const queryStatus = typeof request.query.status === "string" ? request.query.status : null;
  const status = bodyStatus ?? queryStatus ?? "published";

  if (status !== "published" && status !== "failed") {
    throw new HttpsError("invalid-argument", "Invalid deployment status");
  }

  return status;
}

/**
 * Extracts an optional failure description from body or query params.
 *
 * @param {Request} request Incoming HTTP request.
 * @return {string | null} Optional normalized error message.
 */
function getErrorMessage(request: Request): string | null {
  const bodyMessage = typeof request.body?.errorMessage === "string" ? request.body.errorMessage.trim() : "";
  const queryMessage = typeof request.query.errorMessage === "string" ? request.query.errorMessage.trim() : "";
  const errorMessage = bodyMessage || queryMessage;

  return errorMessage ? errorMessage : null;
}
// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
export const triggerAstroBuild = onCall(
  {
    secrets: [githubApiKey],
  },
  async () => {
    const GITHUB_TOKEN = githubApiKey.value();
    const owner = "Mateo-Manchola12";
    const repo = "tutto-a-lena";
    const workFlowId = "astro.yml";
    const ref = "main";

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workFlowId}/dispatches`,
      {
        method: "POST",
        headers: {
          "Authorization": `token ${GITHUB_TOKEN}`,
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ref}),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new HttpsError("internal", `GitHub API error: ${text}`);
    }

    return {
      status: "ok",
      message: "Build triggered",
    };
  },
);

export const completeAstroDeploy = onRequest(
  {
    secrets: [astroCallbackToken],
  },
  async (request, response) => {
    if (request.method !== "POST") {
      response.status(405).json({
        status: "error",
        message: "Method not allowed",
      });
      return;
    }

    const providedToken = getCallbackToken(request);

    if (providedToken !== astroCallbackToken.value()) {
      response.status(401).json({status: "error", message: "Unauthorized"});
      return;
    }

    let completionStatus: PublishCompletionStatus;

    try {
      completionStatus = getCompletionStatus(request);
    } catch (error) {
      if (error instanceof HttpsError) {
        response.status(400).json({status: "error", message: error.message});
        return;
      }

      throw error;
    }

    const errorMessage = getErrorMessage(request);
    const db = getFirestore();
    const currentRef = db.collection("builds").doc("current");

    const result = await db.runTransaction(async (transaction) => {
      const currentSnapshot = await transaction.get(currentRef);

      if (!currentSnapshot.exists) {
        return {status: "noop", message: "No current build state found"};
      }

      const currentData = currentSnapshot.data();
      const currentStatus = currentData?.status;
      const buildId = currentData?.buildId;

      if (currentStatus !== "publishing" || typeof buildId !== "string" || buildId.length === 0) {
        return {status: "noop", message: "No publishing build to finalize"};
      }

      const currentPatch: Record<string, unknown> = {
        status: completionStatus,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (completionStatus === "failed" && errorMessage) {
        currentPatch.errorMessage = errorMessage;
      } else {
        currentPatch.errorMessage = FieldValue.delete();
      }

      transaction.set(currentRef, currentPatch, {merge: true});

      const historyRef = db.collection("builds").doc(buildId);
      const historyPatch: Record<string, unknown> = {
        status: completionStatus,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (completionStatus === "failed" && errorMessage) {
        historyPatch.errorMessage = errorMessage;
      } else {
        historyPatch.errorMessage = FieldValue.delete();
      }

      transaction.set(historyRef, historyPatch, {merge: true});

      return {
        status: "ok",
        message: "Build state updated",
        buildId,
        publishStatus: completionStatus,
      };
    });

    response.status(200).json(result);
  },
);
