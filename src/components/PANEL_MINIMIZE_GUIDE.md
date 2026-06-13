/**
 * PANEL MINIMIZE FEATURE GUIDE
 * 
 * Three ways to add minimize functionality to panels:
 * 
 * 1. COLLAPSIBLE PANEL WITH MINIMIZE (Recommended for complex panels)
 * ────────────────────────────────────────────────────────
 * The CollapsiblePanel component now supports both collapse and minimize:
 * 
 * <CollapsiblePanel
 *   title="Panel Title"
 *   icon={<Icon />}
 *   defaultMinimized={false}
 *   onMinimizeToggle={(isMinimized) => console.log('Minimized:', isMinimized)}
 * >
 *   <YourContent />
 * </CollapsiblePanel>
 * 
 * Features:
 * - Collapse button (ChevronUp/Down)
 * - Minimize button (Minimize2/Maximize2)
 * - Pagination for long content
 * - Can collapse OR minimize independently
 * 
 * 
 * 2. PANEL WITH MINIMIZE WRAPPER (For summary-cards)
 * ────────────────────────────────────────────────────────
 * Wraps any existing panel/summary-card and adds minimize:
 * 
 * <PanelWithMinimize title="My Panel">
 *   <YourContent />
 * </PanelWithMinimize>
 * 
 * Usage:
 * - Simple minimize button in header
 * - Shows minimized state with title only
 * - Auto-styles with summary-card appearance
 * 
 * 
 * 3. CUSTOM MINIMIZE HOOK (For custom components)
 * ────────────────────────────────────────────────────────
 * Use the hook for complete control:
 * 
 * import { useMinimize, PanelMinimizeButton } from './PanelMinimizer.jsx';
 * 
 * function MyPanel() {
 *   const { isMinimized, toggleMinimize } = useMinimize();
 *   
 *   return (
 *     <div className="my-panel">
 *       <header>
 *         <h2>Title</h2>
 *         <PanelMinimizeButton
 *           isMinimized={isMinimized}
 *           onToggle={toggleMinimize}
 *           title="My Panel"
 *         />
 *       </header>
 *       {!isMinimized && <Content />}
 *     </div>
 *   );
 * }
 * 
 * 
 * CSS CLASSES FOR STYLING
 * ────────────────────────────────────────────────────────
 * 
 * For CollapsiblePanel:
 * - .collapsible-panel - container
 * - .is-collapsed - when collapsed
 * - .is-minimized - when minimized
 * - .collapsible-panel-controls - button container
 * - .collapsible-panel-minimize-btn - minimize button
 * - .collapsible-panel-toggle - collapse button
 * 
 * For PanelWithMinimize:
 * - .panel-with-minimize - container
 * - .is-minimized - minimized state
 * - .panel-header-with-controls - header with buttons
 * - .panel-header-controls - button container
 * 
 * For generic minimize:
 * - .panel-minimize-button - button styling
 * - .minimizable-panel - container
 * - .minimized-header - minimized state header
 * 
 * 
 * STYLING NOTES
 * ────────────────────────────────────────────────────────
 * - All minimize buttons use cyan color with rounded borders
 * - Hover state: lighter cyan with expanded background
 * - Minimize state shows compact header only
 * - Smooth transitions (160ms ease) for all state changes
 * - Icons: Minimize2 (minimize), Maximize2 (restore)
 */

export default "Panel Minimize Guide";
