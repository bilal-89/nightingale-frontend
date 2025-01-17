import { Provider } from 'react-redux';
import { store } from './store';
import { TunableKeyboard } from './features/keyboard';
// import BirdsongSynth from './features/keyboard/components/BirdsongSynth';

// Add console logs to help debug
console.log('App rendering');

const App = () => {
    return (
        <Provider store={store}>
            <div className="min-h-screen bg-[#f5f2ed] p-8">
                <div className="container mx-auto max-w-5xl">
                    <h1 className="text-gray-800 text-3xl font-light mb-8 text-center">
                        S-1
                    </h1>
                    <div className="space-y-8">
                        <TunableKeyboard />
                        {/*<BirdsongSynth />*/}
                    </div>
                </div>
            </div>
        </Provider>
    );
};

export default App;