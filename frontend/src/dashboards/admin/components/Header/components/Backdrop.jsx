/**
 * Full-screen invisible overlay. Clicking it closes the active dropdown.
 * Rendered below the dropdown panel (z-50) but above dashboard content.
 *
 * @param {{ onClose: () => void }} props
 */
const Backdrop = ({ onClose }) => (
  <button
    type="button"
    className="fixed inset-0 z-40 cursor-default bg-transparent"
    aria-label="Close dropdown"
    onClick={onClose}
  />
);

export default Backdrop;