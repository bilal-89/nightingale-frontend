import { Provider } from 'react-redux';
import { store } from './store';
import { Player } from "./features/player";
import KeyboardWorkspace from "./features/keyboard/layouts/KeyboardWorkspace";
import ParameterPanel from "./features/parameters/components/ParameterPanel";

// Add console logs to help debug
console.log('App rendering');

const App = () => {
    return (
        <Provider store={store}>
            <div className="min-h-screen bg-[#f5f2ed] p-8">
                <div className="container mx-auto max-w-6xl">
                    {/* Main flex container with column and row layout */}
                    <div className="flex flex-row gap-6">
                        {/* Left content column containing Player and KeyboardWorkspace */}
                        <div className="flex-1 flex flex-col space-y-6">
                            {/* Player component - add max-width constraint */}
                            <div className="max-w-[900px] mx-auto w-full">
                                <Player />
                            </div>

                            {/* KeyboardWorkspace component - constrained size */}
                            <div>
                                <KeyboardWorkspace />
                            </div>
                        </div>

                        {/* Right side parameter panel */}
                        <div className="w-64 flex-shrink-0 h-fit self-start sticky top-8 rounded-3xl p-3 bg-[#e5e9ec]"
                             style={{
                                 boxShadow: '8px 8px 16px #c8ccd0, -8px -8px 16px #ffffff'
                             }}>
                            <ParameterPanel />
                        </div>
                    </div>
                </div>
            </div>
        </Provider>
    );
};

export default App;