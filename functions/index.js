/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const { onRequest } = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.createTestDocument = functions.https.onCall(async (data, context) => {
  // Extract Parameters
  const docData = {test: "this is a test!"};

  try {
    await admin.firestore().collection("test").add(docData);
    return {result: "A new document has been created."};
  } catch (error) {
    console.error("Error creating new document: ", error);
    throw new functions.https.HttpsError(
        "internal",
        "Failed to create a new document",
    );
  }
});

exports.transaction = functions.https.onCall(async (data, context) => {
  // Extract Parameters
  const {tokenId, from, to, price, chainId} = data;

  // Check if all required parameters are provided
  if (!tokenId || !from || !to || !price) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "One or more required parameters are missing",
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);

  const docData = {
    tokenId: tokenId,
    from: from,
    to: to,
    timestamp: timestamp,
    price: price,
    chainId: chainId,
  };

  const infoData = {
    lastPrice: price,
    lastSale: timestamp,
  };

  const docSale = tokenId + "-" + from;
  const docSaleRef = admin.firestore().collection("sale").doc(docSale);
  const docOffer = tokenId + "-" + to;
  const docOfferRef = admin.firestore().collection("offer").doc(docOffer);
  const docInfoRef = admin.firestore().collection("info").doc(tokenId);

  try {
    await admin.firestore().collection("transactions").add(docData);
    await docInfoRef.set(infoData, {merge: true});
    await docSaleRef.delete();
    await docOfferRef.delete();
    return {result: "A new transaction document has been created."};
  } catch (error) {
    console.error("Error creating new transaction document: ", error);
    throw new functions.https.HttpsError(
        "internal",
        "Failed to create a new transaction document",
    );
  }
});

exports.createNft = functions.https.onCall(async (data, context) => {
  const {tokenId, uri, chainId} = data;
  // const fieldValue = admin.firestore.FieldValue;
  const timestamp = Math.floor(Date.now() / 1000);
  const docRef = admin.firestore().collection("info").doc(tokenId.toString());

  const ipfsUrl = uri.replace("ipfs://", "https://ipfs.io/ipfs/");

  try {
    const response = await fetch(ipfsUrl);
    const text = await response.text();
    const metadata = JSON.parse(text);
    const imageUri = metadata.image;

    await docRef.set({
      tokenId: tokenId,
      uri: uri,
      image: imageUri,
      timestamp: timestamp,
      chainId: chainId,
    });
  } catch (error) {
    console.error("Error creating new transaction document: ", error);
    throw new functions.https.HttpsError(
        "internal",
        "Failed to create a new transaction document",
    );
  }
});
