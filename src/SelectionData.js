import React, { useState, createContext, useEffect } from "react";

// Create the context
export const SelectionData = createContext({});

export const SelectionDataProvider = ({ children }) => {
  const [selectionData, setSelectionData] = useState({});

  // Save data to local storage whenever selectionData changes
  useEffect(() => {
    localStorage.setItem("selectionData", JSON.stringify(selectionData));
  }, [selectionData]);

  return (
    <SelectionData.Provider value={{ selectionData, setSelectionData }}>
      {children}
    </SelectionData.Provider>
  );
};
