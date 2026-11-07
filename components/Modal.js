import styles from "./Siburi.module.css";

export default function Modal({isOpen,onClose}) {

    if(!isOpen){
        return null;
    } 
  return (
    <section className={styles.infosection}>
      <div id="documentation">
      <h2>SIBURI Documentation</h2>
        <p>Welcome to the SIBURI documentation. Follow the steps below to use the website:</p>

        <div >
          <h3>Step 1: Select an Image</h3>
          <ol>
            <li>Navigate to the SIBURI website.</li>
            <li>In the left column, you will find the --Select an image-- section.</li>
            <li>Click on the --Select-- button to choose an image from your device.</li>
            <li>Accepted file extensions are: {"'JPG'"}, {"'JPEG'"}, {"'PNG'"}, {"'BMP'"}, {"'GIF'"}, {"'WEBP'"}</li>
            <li>⚠️ Upload images captured with a white light source positioned above and in front of the micro-tubes. ⚠️</li>
            <li>⚠️ Perform manual analysis for tubes containing almost transparent liquids ⚠️</li>
          </ol>
        </div>

        <div >
          <h3>Step 2: Set Sampling Size</h3>
          <ol>
            <li>Adjust the sampling size using the --Set sampling size-- slider.</li>
            <li>Move the slider to the desired sampling size (ranging from 1 to 5).</li>
            <li>Select samples from different locations of a tube to include edge cases.</li>
            <li>The sampling size determines the area (N by N dimensional pixels) from which the color will be sampled.</li>
          </ol>
        </div>

        <div >
          <h3>Step 3: Set Magnification Size</h3>
          <ol>
            <li>Adjust the magnification using the --Set magnification size-- slider.</li>
            <li>Move the slider to the desired sampling size (ranging from 1 to 60).</li>
            <li>The magnification resizes the resolution of the sampling size.</li>
            <li>E.g. A sample size of 2 with magnification 10 will be displayed as a square of resolution 20 by 20 (10 + 10 + 10 + 10) pixels.</li>
          </ol>
        </div>

        <div >
          <h3>Step 4: Set Total Samples for a Tube</h3>
          <ol>
            <li>Specify the total number of samples using the --Set total samples for a tube-- slider.</li>
            <li>Move the slider to the desired sampling size (ranging from 7 to 10).</li>
            <li>The value should not be less than 10 (for Smartphone users).</li>
          </ol>
        </div>

        <div >
          <h3>Step 5: Explore Colors</h3>
          <ol>
            <li>The selected image will be displayed in the right column.</li>
            <li>Hover over the image to preview color details.</li>
          </ol>
        </div>

        <div >
          <h3>Step 6: Select type</h3>
          <ol>
            <li>'SIBURI' / 'SIBURI+' are colour-changing soups that tell you if bacteria are growing in urine in 6 hours.</li>
            <li>'SIBURI' has a special liquid that turns 'pink - red' when bacteria eat nitrate and make nitrite.</li>
            <li>'SIBURI+' has a different liquid that turns 'greenish - yellow' when bacteria make acid while growing.</li>
          </ol>
        </div>
        
        <div >
          <h3>Step 7: Enable Color Selection</h3>
          <ol>
            <li>Enable sample selection for a tube by clicking the --Enable Selection-- button or by pressing the {"'N'"} key.</li>
            <li>Click on the image to pick samples.</li>
            <li>The total selected samples will be shown below this button.</li>
          </ol>
        </div>

        <div >
          <h3>Step 8: View Selected Colors</h3>
          <ol>
            <li>As you click on the image, selected colors will be displayed in the --View selected-- section.</li>
            <li>Each color will show its rank (--S-- for sensitive, --R-- for resistance) and brightness level.</li>
            <li>A maximum of 100 colors can be selected. If you try to exceed this limit, a notification will appear.</li>
          </ol>
        </div>

        <div >
          <h3>Why need 2 tubes?</h3>
          <ol>
            <li>One tube alone misses 30% of infections. Together they catch 92.7%.</li>
            <li>SIBURI catches the nitrate-makers, SIBURI+ catches the acid-makers. Together they catch almost all.</li>
          </ol>
        </div>

        <p>Thank you for using the SIBURI application!</p>
      </div>
      <button className={styles.remove} onClick={()=>onClose()}>Close</button>
      </section>
  );
}
