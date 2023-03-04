import { useState } from 'react';
import { EditModeContext, EditModeSetterContext } from './context';

const AppProvider = ({ children }) => {
  const [isEditMode, setIsEditMode] = useState(false);

  return (
    <EditModeContext.Provider value={isEditMode}>
      <EditModeSetterContext.Provider value={setIsEditMode}>
        {children}
      </EditModeSetterContext.Provider>
    </EditModeContext.Provider>
  );
};

export default AppProvider;
