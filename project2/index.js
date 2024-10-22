import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.js';

import { SelectionDataProvider } from './SelectionData.js';

// import { collection, getDocs } from "firebase/firestore"; 
// import { db } from './config/firestore.js'

// const querySnapshot = await getDocs(collection(db, "Participant_Response"));
// querySnapshot.forEach((doc) => {
//   console.log(`${doc.id} => ${doc.data()}`);
// });

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
  <SelectionDataProvider>
    <App />
  </SelectionDataProvider>
  // </React.StrictMode>
);

// console.log(firebaseConfig)