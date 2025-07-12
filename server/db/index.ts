
// import { initializeApp } from "firebase/app";

// const firebaseConfig = {
//   apiKey: "AIzaSyC5DXJl37G_W_gTeKXzkosUas9cbuRr3IA",
//   authDomain: "plero-53c8f.firebaseapp.com",
//   projectId: "plero-53c8f",
//   storageBucket: "plero-53c8f.firebasestorage.app",
//   messagingSenderId: "569413580792",
//   appId: "1:569413580792:web:f4ea8cc316dd2ceb04880d",
//   measurementId: "G-MVVBQ0GKYM"
// };


// const app = initializeApp(firebaseConfig);

// export default app;

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
const client = new DynamoDBClient({
    region: "ap-northeast-2",
    credentials: {
        accessKeyId: process.env.NUXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NUXT_AWS_SECRET_ACCESS_KEY!,
    },
});

export default client;