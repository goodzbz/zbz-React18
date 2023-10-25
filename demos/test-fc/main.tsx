import React, { useEffect } from 'react';
import { useState } from 'react';
import ReactDOM from 'react-dom';
function App() {
	const [num, updateNum] = useState(100);

	return (
		<ul onClick={() => updateNum(50)}>
			{new Array(num).fill(0).map((_, i) => {
				return <Children key={i}>{i}</Children>;
			})}
		</ul>
	);
}
function Children({ children }) {
	const now = performance.now();
	while (performance.now() - now < 4) {}
	return <li>{children}</li>;
}

ReactDOM.createRoot(document.querySelector('#root') as HTMLElement).render(
	<App />
);
