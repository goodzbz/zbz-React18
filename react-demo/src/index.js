import React from 'react';
import ReactDOM from 'react-dom';

// const jsx = (
// 	<div>
// 		<span>big-react</span>
// 	</div>
// );
function App() {
	return (
		<div>
			<Children />
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
const root = document.querySelector('#root');
ReactDOM.createRoot(root).render(<App />);
console.log(React);
console.log('children', Children);

console.log(ReactDOM);
