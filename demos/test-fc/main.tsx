import React, { useEffect } from 'react';
import { useState } from 'react';
import ReactDOM from 'react-dom';
console.log(ReactDOM);
function App() {
	const [num, updateNum] = useState(0);
	// setNum(100); re-render  render时期渲染是要报错的
	useEffect(() => {
		console.log('App mount');
	}, []);
	useEffect(() => {
		console.log('num change create', num);
		return () => {
			console.log('num change destroy', num);
		};
	});
	return (
		<div onClick={() => updateNum((num) => num + 1)}>
			{num === 0 ? <Children /> : 'noop'}
		</div>
	);
}
function Children() {
	useEffect(() => {
		console.log('child mount');
		return () => console.log('child unmount');
	});
	return 'i am child';
}

ReactDOM.createRoot(document.querySelector('#root') as HTMLElement).render(
	<App />
);
