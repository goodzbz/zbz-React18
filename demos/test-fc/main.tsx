import { createContext, useContext } from 'react';
import ReactDOM from 'react-dom';
// scheucler 调度  并发 && 同步
// function App() {
// 	const [num, updateNum] = useState(100);

// 	return (
// 		<ul onClick={() => updateNum(50)}>
// 			{new Array(num).fill(0).map((_, i) => {
// 				return <Children key={i}>{i}</Children>;
// 			})}
// 		</ul>
// 	);
// }
// function Children({ children }) {
// 	const now = performance.now();
// 	while (performance.now() - now < 4) {}
// 	return <li>{children}</li>;
// }

/**
 * 测试 useRef
 */

// import { useEffect, useState, useRef } from 'react';

// function App() {
// 	const [isDel, del] = useState(false);
// 	const divRef = useRef(null);
// 	console.warn('render divRef', divRef.current);
// 	useEffect(() => {
// 		console.warn('useEffect divRef', divRef.current);
// 	}, []);
// 	return (
// 		<div ref={divRef} onClick={() => del(true)}>Ref
// 			{isDel ? null : <Child />}
// 		</div>
// 	);
// }
// function Child() {
// 	return (
// 		<p
// 			ref={(dom) => {
// 				console.warn('dom is:', dom);
// 			}}
// 		>
// 			Child
// 		</p>
// 	);
// }

const ctxA = createContext('default A');
const ctxB = createContext('default B');

function App() {
	return (
		<ctxA.Provider value={'A0'}>
			<ctxB.Provider value={'B0'}>
				<ctxA.Provider>
					<Cpn></Cpn>
				</ctxA.Provider>
			</ctxB.Provider>
			<Cpn></Cpn>
		</ctxA.Provider>
	);
}

function Cpn() {
	const a = useContext(ctxA);
	const b = useContext(ctxB);
	return (
		<div>
			A:{a} B:{b}
		</div>
	);
}

ReactDOM.createRoot(document.querySelector('#root') as HTMLElement).render(
	<App />
);
