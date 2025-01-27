import { useState } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { TunableKeyboard } from './features/keyboard';
import { ArrangementView } from "./features/arrangement";
import { Player } from "./features/player";  // Import our new Player component
import ParameterPanel from "./features/parameters/components/ParameterPanel.tsx";
import KeyboardWorkspace from "./features/workspace/components/KeyboardWorkspace.tsx";

// Add console logs to help debug
console.log('App rendering');

const App = () => {
    // Add state for toggling between old and new implementations
    const [useNewPlayer, setUseNewPlayer] = useState(false);

    return (
        <Provider store={store}>
            <div className="min-h-screen bg-[#f5f2ed] p-8">
                <div className="container mx-auto max-w-5xl">
                    <div className="space-y-8">
                        {/* Add a development toggle */}


                        {/* Conditionally render either the new Player or existing ArrangementView */}
                        <Player />

                        <KeyboardWorkspace />
                    </div>
                </div>
            </div>
        </Provider>
    );
};

export default App;