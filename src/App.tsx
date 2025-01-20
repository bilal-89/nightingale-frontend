import { Provider } from 'react-redux';
import { store } from './store';
import { TunableKeyboard } from './features/keyboard';
import { ArrangementView } from "./features/arrangement";
// import BirdsongSynth from './features/keyboard/components/BirdsongSynth';

// Add console logs to help debug
console.log('App rendering');

const App = () => {
    return (
        <Provider store={store}>
            <div className="min-h-screen bg-[#f5f2ed] p-8">
                <div className="container mx-auto max-w-5xl">
                    <div className="space-y-8">
                        <ArrangementView />

                        <TunableKeyboard />
                        {/*<BirdsongSynth />*/}
                    </div>
                </div>
            </div>
        </Provider>
    );
};

export default App;