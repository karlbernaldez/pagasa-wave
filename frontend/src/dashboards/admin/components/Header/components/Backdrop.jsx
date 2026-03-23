/**
 * Full-screen invisible overlay. Clicking it closes the active dropdown.
 * Rendered below the dropdown panel (z-10) so the panel stays on top (z-20).
 *
 * @param {{ onClose: () => void }} props
 */
const Backdrop = ({ onClose }) => (
  <div
    className="fixed inset-0 z-10"
    aria-hidden="true"
    onClick={onClose}
  />
);

export default Backdrop;