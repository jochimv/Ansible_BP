import { useState } from 'react';
import { EditModeContext, EditModeSetterContext } from './context';

const AppProvider = ({ children }) => {
  const [isInEditMode, setIsInEditMode] = useState(false);

  return (
    <EditModeContext.Provider value={isInEditMode}>
      <EditModeSetterContext.Provider value={setIsInEditMode}>
        {children}
      </EditModeSetterContext.Provider>
    </EditModeContext.Provider>
  );
};

export default AppProvider;
