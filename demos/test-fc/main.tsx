import React from 'react';
import { useState } from 'react';
import ReactDOM from 'react-dom';
console.log(ReactDOM);
function App() {
	const [num, setNum] = useState(100);
	window.setNum = setNum;
	return num == 3 ? <Children /> : <div>{num}</div>;
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
