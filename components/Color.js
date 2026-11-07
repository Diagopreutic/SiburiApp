import styles from "./Siburi.module.css";

/**
 * Color Component
 * Displays a colored box with additional information, allowing users to remove the color.
 * @param {Object} props - The properties passed to the component.
 * @param {Object} props.color - The color object containing RGB values.
 * @param {string} [props.rank='R'] - The rank of the color (default: 'R' for Resistance).
 * @param {function} props.setColors - The function to set selected colors.
 * @param {string} props.fReport - The final report of the color.
 * @returns {JSX.Element} - The JSX representation of the Color component.
 */
export default function Color({ color, rank = "SIBURI", setColors, fReport, annotations, setAnnotations, index }) {
  /**
   * Handles the color change event.
   * Removes the color from the selected colors.
   */
  const changecolor = () => {
    setColors(prev => prev.filter(p => p !== color));
    // Remove the annotation at the corresponding index
    setAnnotations(prev => prev.filter((_, i) => i !== index));
  };


  const escapeAnnotation = (str) => {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      /*.replace(/</g, '&lt;')*/
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/`/g, '&#x60;');
  };


  /*const handleAnnotationChange = (e) => {
    const newAnnotations = [...annotations];
    newAnnotations[index] = e.target.value.trim();
    setAnnotations(newAnnotations);
  };*/

  const handleAnnotationChange = (e) => {
    const safe = escapeAnnotation(e.target.value.trim());
    const newAnnotations = [...annotations];
    newAnnotations[index] = safe;
    setAnnotations(newAnnotations);
  };


  return (
    <div className={styles.selectedColor} style={{width: "fit-content", maxWidth: "100%", placeItems: "stretch", background: `rgb(${color.r}, ${color.g}, ${color.b})`,}}>
      <div className={styles.selectedcolorinfo} style={{width: "100%", minWidth: 0, boxSizing: "border-box", background: `rgb(${color.r}, ${color.g}, ${color.b})`}}>
        <div className="selectedcolorinfo-top" style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "6px"}} >
          <input
            value={annotations[index] || ""}
            onChange={handleAnnotationChange}
            placeholder="type..."
            type="text"
            style={{width: "8rem", flexShrink: 0, border: "1px solid black", margin: 0, textAlign: "left", backgroundColor: "white", color: "black", fontSize: "12px"}} //padding: ".2rem"
          />          
          <div style={{width: "3.5rem",fontSize: "14px", whiteSpace: "nowrap",
            color: (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) > 128 ? "black" : "white"
          }}>
            {fReport}
          </div>
        </div>
        <button className={styles.remove} onClick={() => changecolor()}>Remove</button>
      </div>

    </div>
  );
}
