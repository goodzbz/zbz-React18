import React from 'react';
import { useState } from 'react';
import ReactDOM from 'react-dom';
console.log(ReactDOM);
function App() {
	const [num, setNum] = useState(100);
	// setNum(100); re-render  render时期渲染是要报错的
	console.log(1);
	return (
		<div
			onClick={(e) => {
				console.log(e.target);
			}}
		>
			<span
				onClick={(e) => {
					console.log(e.target);
				}}
			>
				this is a span
			</span>
		</div>
	);
}
function Children() {
	return (
		<div>
			<span>big-react</span>
		</div>
	);
}

ReactDOM.createRoot(document.querySelector('#root') as HTMLElement).render(
	<App />
);
