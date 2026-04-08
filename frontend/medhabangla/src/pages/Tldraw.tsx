import React from 'react';
import Navbar from '../components/Navbar';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';

const TldrawPage: React.FC = () => {
	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			<Navbar />

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				<div className="mb-4">
					<h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
						TLDraw Whiteboard
					</h1>
					<p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-300">
						Draw diagrams, flowcharts, notes, and visual ideas using TLDraw free features.
						Your board is automatically saved in this browser.
					</p>
				</div>

				<div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg bg-white dark:bg-gray-800">
					<div className="h-[75vh] md:h-[80vh]">
						<Tldraw persistenceKey="medhabangla-tldraw-board" />
					</div>
				</div>

				<div className="mt-4 text-xs md:text-sm text-gray-500 dark:text-gray-400">
					Tips: use pen, shapes, text, arrows, sticky notes, images, and export options directly from the TLDraw toolbar.
				</div>
			</div>
		</div>
	);
};

export default TldrawPage;
