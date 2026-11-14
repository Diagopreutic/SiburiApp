'use client';

import React, { useCallback, useEffect, useState, useRef } from "react";
import styles from "./Siburi.module.css";
import Color from "./Color";
import Modal from "./Modal";


function rgbToHsv(r, g, b) {
    /**
     * Convert RGB values (0-255) to HSV values.
     * Returns:
     *   H: Hue (0-360 degrees)
     *   S: Saturation (0-100%)
     *   V: Value/Brightness (0-100%)
     */
    
    // Normalize RGB values to 0-1 range
    const rNorm = r / 255.0;
    const gNorm = g / 255.0;
    const bNorm = b / 255.0;
    
    // Find max and min values
    const maxVal = Math.max(rNorm, gNorm, bNorm);
    const minVal = Math.min(rNorm, gNorm, bNorm);
    const delta = maxVal - minVal;
    
    // Calculate Value (brightness)
    const v = maxVal * 100; // Convert to percentage
    
    // Calculate Saturation
    let s;
    if (maxVal === 0) {
        s = 0;
    } else {
        s = (delta / maxVal) * 100; // Convert to percentage
    }
    
    // Calculate Hue
    let h;
    if (delta === 0) {
        h = 0; // Gray has no hue
    } else if (maxVal === rNorm) {
        h = 60 * (((gNorm - bNorm) / delta) % 6);
    } else if (maxVal === gNorm) {
        h = 60 * (((bNorm - rNorm) / delta) + 2);
    } else { // maxVal === bNorm
        h = 60 * (((rNorm - gNorm) / delta) + 4);
    }
    
    // Ensure hue is positive
    if (h < 0) {
        h += 360;
    }
    
    return {
        h: Math.round(h * 10) / 10,
        s: Math.round(s * 10) / 10,
        v: Math.round(v * 10) / 10
    };
}

function hsvToRgb(h, s, v) {
    // Normalize S and V to 0-1 range
    s = s / 100.0;
    // reduce the grayscale for 'v'
    /*if (v < 100) {
      v = 100;
    }*/
    v = v / 100.0;
    
    // Calculate chroma
    const c = v * s;
    
    // Calculate hue sector
    const hPrime = h / 60.0;
    const x = c * (1 - Math.abs(hPrime % 2 - 1));
    
    // Determine RGB based on hue sector
    let r1, g1, b1;
    if (hPrime >= 0 && hPrime < 1) {
        r1 = c; g1 = x; b1 = 0;
    } else if (hPrime >= 1 && hPrime < 2) {
        r1 = x; g1 = c; b1 = 0;
    } else if (hPrime >= 2 && hPrime < 3) {
        r1 = 0; g1 = c; b1 = x;
    } else if (hPrime >= 3 && hPrime < 4) {
        r1 = 0; g1 = x; b1 = c;
    } else if (hPrime >= 4 && hPrime < 5) {
        r1 = x; g1 = 0; b1 = c;
    } else {
        r1 = c; g1 = 0; b1 = x;
    }
    
    // Calculate m (amount to add to match value)
    const m = v - c;
    
    // Convert to 0-255 range
    const r = Math.round((r1 + m) * 255);
    const g = Math.round((g1 + m) * 255);
    const b = Math.round((b1 + m) * 255);
    
    return { r, g, b };
}

function hueMinRange(currentHue, minHue) {
  let h_intensity = 0;
  if (currentHue <= 60) {
    h_intensity = currentHue + 60;
  }
  else {
    h_intensity = currentHue - 300;
  }

  if (Math.abs(h_intensity - minHue) <= 3) {
    return 1;
  }
  else {
    return 0;
  }
}


// Arrange values of Selected Colors to printing (an alternative of sortSelected())
function arrangeSelected(colorsSlct, annotStr) {

  let finalVals = [];
  for (let i = 0; i < colorsSlct.length; i += 1) {
    const r = colorsSlct[i]?.r;
    const g = colorsSlct[i]?.g;
    const b = colorsSlct[i]?.b;
    
    let bgrd = '';
    bgrd = (0.299 * r + 0.587 * g + 0.114 * b) > 128 ? "black" : "white";

    finalVals.push([colorsSlct[i], annotStr[i + 1], bgrd]);
  }
  //alert(JSON.stringify(temp1) + "\n\n" + JSON.stringify(doubleValsS));
  //alert(JSON.stringify(temp1) + "\n\n" + JSON.stringify(doubleValsR));

  let retColors = [[], [], []];
  for (let i = 0; i < finalVals.length; i += 1) {
    retColors[0].push(finalVals[i][0]);
    retColors[1].push(finalVals[i][1]);
    retColors[2].push(finalVals[i][2]);
  }
  return retColors;
}

/**
 * SiburiApp Component
 * Allows users to pick colors from an image and see selected colors.
 */
const SiburiApp = () => {
  // State for the selected image
  const [image, setImage] = useState(null);
  // Display string for output colors
  const [selectString, setSelectString] = useState('3. Color samples count');
  // State for the selected colors
  const [colors, setColors] = useState([]);
  // Reference to the canvas element
  const canvasRef = useRef(null);
  // State for the sampling size used to calculate average color
  const [samplingSize, setSamplingSize] = useState(1);
  // State for the magnification factor used for hovering effect
  const [magnificationFactor, setMagnificationFactor] = useState(40);
  // State for the no. of samples for each tube
  const [colorSampling, setcolorSampling] = useState(7);

  // State for the modal to open and close
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [annotations, setAnnotations] = useState([]);

  const [formstate, setFormstate] = useState(false);

  // Track the magnified canvas
  const magnifiedRef = useRef(null);

  // Track the hover text element showing sample count near cursor
  const hoverTextRef = useRef(null);

  // Helper Functions (Place clearMagnifier here)
  const clearMagnifier = useCallback(() => {
    if (magnifiedRef.current) {
      if (document.body.contains(magnifiedRef.current)) {
        document.body.removeChild(magnifiedRef.current);
      }
      magnifiedRef.current = null;
    }
    // Also clear hover text
    if (hoverTextRef.current) {
      if (document.body.contains(hoverTextRef.current)) {
        document.body.removeChild(hoverTextRef.current);
      }
      hoverTextRef.current = null;
    }
  }, []);

  // State for SIBURI type
  const [siburiType, setSiburiType] = useState("SIBURI_n");
  const siburiOptions = [
    { id: "opt-siburi", value: "SIBURI_n", label: "SIBURI" },
    { id: "opt-siburi-plus", value: "SIBURI_p", label: "SIBURI+" }
  ];
  const selectedLabel = siburiOptions.find((o) => o.value === siburiType)?.label;

  const handleSiburi = (event) => {
    setSelectedValue(event.target.value);
  };

  const [sampleColorList, setSampleColorList] = useState([]);
  const [newColor, setNewColor] = useState(false);
  const maxSaturation = 30;

  const [tubeCount, setTubeCount] = useState(1);
  //let tubeCount = 0;

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  /**
   * Handles file input change and sets the selected image.
   * @param {Object} e - The event object representing the file input change.
   */
  const handleFileInput = (e) => {
    const file = e.target.files[0];
  
    if (!file) {
      return;
    }

    // Define maximum file size (e.g., 10MB = 10 * 1024 * 1024 bytes)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      alert(`File size too large! Maximum allowed size is ${MAX_FILE_SIZE / (1024 * 1024)}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
      e.target.value = ''; // Clear the file input
      return;
    }
    
    // Check file type (additional validation)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      //alert('Invalid file type! Please upload a JPEG, PNG, BMP, GIF, or WebP image.');
      e.target.value = ''; // Clear the file input
      return;
    }
    setImage(URL.createObjectURL(file));
  };

  const handleSampleCount = (e) => {
    setcolorSampling(e.target.value);
  };

  const handleNewColor = useCallback(() => {
    if (sampleColorList.length > colorSampling) {
      setNewColor(false);
    }
    else {
      setNewColor(true);
    }
    clearMagnifier();
  });

  let nColor = [];
  /**
   * Handles canvas click event and calculates the average color of the selected area.
   * Adds the color to selected colors based on conditions.
   * @param {Object} e - The event object representing the canvas click.
   */
  const handleCanvasClick = (e) => {
    //alert(newColor + " " + sampleColorList.length);
    if (newColor == false) {
      return;
    }
    if (sampleColorList.length > colorSampling) {
      return;
    }

    else if (newColor == true) {
      if ((sampleColorList.length == colorSampling - 1) || (sampleColorList.length == colorSampling)) {
        setSelectString('3. Select samples for test tube');

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        let rect = canvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;

        const imageData = context?.getImageData(
          x - Math.floor(samplingSize / 2),
          y - Math.floor(samplingSize / 2),
          samplingSize,
          samplingSize
        );
        
        // Draw the coordinates on canvas
        //context.font = '20px Arial';
        //context.fillStyle = 'white';
        //context.strokeStyle = 'blue';
        //context.lineWidth = 3;
        
        setTubeCount(tubeCount + 1);
        //tubeCount = tubeCount + 1;
        // Draw outline for visibility
        //context.strokeText(`(${Math.round(x)}, ${Math.round(y)})`, x, y);
        //context.strokeText(`${tubeCount}`, x, y);
        // Draw filled text
        //context.fillText(`(${Math.round(x)}, ${Math.round(y)})`, x, y);
        //context.fillText(`${tubeCount}`, x, y);

        let avgRed = 0;
        let avgGreen = 0;
        let avgBlue = 0;

        // Build newIndvColors array
        const newIndvColors = [];
        for (let i = 0; i < imageData.data.length; i += 4) {
          const { h, s, v } = rgbToHsv(imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]);
          const new_rgb = hsvToRgb(h, s, v);
          const color_i = [new_rgb.r, new_rgb.g, new_rgb.b, h, s, v];
          newIndvColors.push(color_i);
        }

        // Create updated sample list (local variable)
        let updatedSampleList = [...sampleColorList, newIndvColors];

        // Build validColors array using updatedSampleList
        const newValidColors = [];
        
        //alert(`Siburi type : ${selectedLabel}`);
        let temp_cn = 0;
        if (selectedLabel == "SIBURI") {
          // Filter out Blue, Cyan, Green
          updatedSampleList = updatedSampleList.map(item => item.filter(element => element[3] <= 60 || element[3] >= 300 || 
            (element[3] > 60 && element[3] < 300 && element[4] < 15)));
        }
        else {
          // Filter out Magenta, Red, Orange
          updatedSampleList = updatedSampleList.map(item => item.filter(element => element[3] > 49 && element[3] < 216));
        }
        for (let i = 0; i < updatedSampleList.length; i += 1) {
          temp_cn += updatedSampleList[i].length;
        }

        if (temp_cn == 0) {
          clearMagnifier();
          setAnnotations((prev) => [...prev, ""]);
          // Update all state at the end
          setSampleColorList([]);
          setNewColor(false);
          setSelectString('3. Select samples for test tube');
          return;
        }

        // New code

        // remove the pixels if they share less than 8% area
        let count_un = 0;
        let total_pixels = 0;
        for (let i = 0; i < updatedSampleList.length; i += 1) {
          for (let j = 0; j < updatedSampleList[i].length; j += 1) {
            if ((updatedSampleList[i][j][4] <= 50) && (updatedSampleList[i][j][5] >= 80)) {
              count_un += 1;
            total_pixels += 1;
            }
          }
        }
        if (count_un < (0.08 * total_pixels)) {
          updatedSampleList = updatedSampleList.map(item => item.filter(element => (element[4] <= 50 && element[5] >= 80)));
        }

        if (selectedLabel == "SIBURI") {
          let ColorCount = 0;
          for (let i = 0; i < updatedSampleList.length; i += 1) {
            let max_S = -1;
            let max_V = -1;
            for (let j = 0; j < updatedSampleList[i].length; j += 1) {
              if (updatedSampleList[i][j][4] <= 50) {
                if (updatedSampleList[i][j][4] > max_S) {
                  max_S = updatedSampleList[i][j][4];
                }
              }
              if (updatedSampleList[i][j][5] > max_V) {
                max_V = updatedSampleList[i][j][5];
              }
            }
            if ((max_S <= 50 && max_S > -1) && (max_V > 50)) {
              ColorCount += 1;
            }
          }

          if (colorSampling == ColorCount) {
            let max_V = 80;
            for (let i = 0; i < updatedSampleList.length; i += 1) {
              for (let j = 0; j < updatedSampleList[i].length; j += 1) {
                if (updatedSampleList[i][j][5] >= max_V) {
                  max_V = updatedSampleList[i][j][5];
                }
              }
            }
            for (let i = 0; i < updatedSampleList.length; i += 1) {
              for (let j = 0; j < updatedSampleList[i].length; j += 1) {
                const upd_rgb = hsvToRgb(updatedSampleList[i][j][3], updatedSampleList[i][j][4], max_V);
                const upd_color_j = [upd_rgb.r, upd_rgb.g, upd_rgb.b, updatedSampleList[i][j][3], updatedSampleList[i][j][4], max_V];
                // Replace it in the structure
                updatedSampleList[i] = [...updatedSampleList[i]];
                updatedSampleList[i][j] = upd_color_j;
              }
            }
          }
          else {
            let min_V = 100;
            let max_V = 0;
            let min_H = 360;
            let max_H = 0;
            let max_S = 0;
            for (let i = 0; i < updatedSampleList.length; i += 1) {
              for (let j = 0; j < updatedSampleList[i].length; j += 1) {
                if (updatedSampleList[i][j][5] < min_V) {
                  min_V = updatedSampleList[i][j][5];
                }
                if (updatedSampleList[i][j][5] > max_V) {
                  max_V = updatedSampleList[i][j][5];
                }
                if (updatedSampleList[i][j][4] > max_S) {
                  max_S = updatedSampleList[i][j][4];
                }
                if (updatedSampleList[i][j][3] < min_H) {
                  min_H = updatedSampleList[i][j][3];
                }
                if (updatedSampleList[i][j][3] > max_H) {
                  max_H = updatedSampleList[i][j][3];
                }
              }
            }
            if (min_H <= 10 || min_H >= 300) { // Choose Maroon over pink
              // Filter by S and V
              updatedSampleList = updatedSampleList.map(item => item.filter(element => element[4] >= (max_S - 2) && element[4] <= max_S));
              min_V = 100;
              for (let i = 0; i < updatedSampleList.length; i += 1) {
                for (let j = 0; j < updatedSampleList[i].length; j += 1) {
                  if (updatedSampleList[i][j][5] < min_V) {
                    min_V = updatedSampleList[i][j][5];
                  }
                }
              }
              updatedSampleList = updatedSampleList.map(item => item.filter(element => element[5] >= min_V && element[5] <= (min_V + 3)));
            }
            
            else if (min_V >= 25 && max_V <= 50 && min_H < 38) {
              // Filter by V == min_V
              updatedSampleList = updatedSampleList.map(item => item.filter(element => element[5] == min_V));
            }

            else {
              if (min_H >= 38 && max_H <= 60) { // yellow >= 5mM
                let testList = updatedSampleList.map(item => item.filter(element => element[5] < 75));
                let testcount = 0;
                for (let k = 0; k < testList.length; k += 1) {
                  if (testList[k].length > 0) {
                    testcount += 1;
                  }
                }
                if (testcount > 0) {
                  updatedSampleList = updatedSampleList.map(item => item.filter(element => element[5] < 75));
                
                  for (let i = 0; i < updatedSampleList.length; i += 1) {
                    for (let j = 0; j < updatedSampleList[i].length; j += 1) {
                      const upd_rgb = hsvToRgb(max_H, updatedSampleList[i][j][4], 70);
                      const upd_color_j = [upd_rgb.r, upd_rgb.g, upd_rgb.b, max_H, updatedSampleList[i][j][4], 70];
                      // Replace it in the structure
                      updatedSampleList[i] = [...updatedSampleList[i]];
                      updatedSampleList[i][j] = upd_color_j;
                    }
                  }
                }
                else {
                  let temp_V = 0;
                  for (let i = 0; i < updatedSampleList.length; i += 1) {
                    for (let j = 0; j < updatedSampleList[i].length; j += 1) {
                      if (updatedSampleList[i][j][5] > temp_V) {
                        temp_V = updatedSampleList[i][j][5];
                      }
                    }
                  }
                  if (temp_V >= 70) {
                    for (let i = 0; i < updatedSampleList.length; i += 1) {
                      for (let j = 0; j < updatedSampleList[i].length; j += 1) {
                        const upd_rgb = hsvToRgb(max_H, updatedSampleList[i][j][4], 70);
                        const upd_color_j = [upd_rgb.r, upd_rgb.g, upd_rgb.b, max_H, updatedSampleList[i][j][4], 70];
                        // Replace it in the structure
                        updatedSampleList[i] = [...updatedSampleList[i]];
                        updatedSampleList[i][j] = upd_color_j;
                      }
                    }
                  }
                  else {
                    for (let i = 0; i < updatedSampleList.length; i += 1) {
                      for (let j = 0; j < updatedSampleList[i].length; j += 1) {
                        const upd_rgb = hsvToRgb(max_H, updatedSampleList[i][j][4], temp_V);
                        const upd_color_j = [upd_rgb.r, upd_rgb.g, upd_rgb.b, max_H, updatedSampleList[i][j][4], temp_V];
                        // Replace it in the structure
                        updatedSampleList[i] = [...updatedSampleList[i]];
                        updatedSampleList[i][j] = upd_color_j;
                      }
                    }
                  }
                }
              }

              else {
                let ColorCount_S = 0;
                for (let i = 0; i < updatedSampleList.length; i += 1) {
                  let current_S = 0;
                  for (let j = 0; j < updatedSampleList[i].length; j += 1) {
                    if (updatedSampleList[i][j][4] >= 65) {
                      current_S += 1;
                    }
                  }
                  if (current_S > 0) {
                    ColorCount_S += 1;
                  }
                }
                //alert(JSON.stringify(updatedSampleList) + " " + ColorCount_S);
                if (ColorCount_S > 0) {
                  // Filter by S < 70
                  if (min_V >= 55 && min_V <= 65) {
                    updatedSampleList = updatedSampleList.map(item => item.filter(element => (element[4] >= 65 && element[5] >= min_V)));
                  }
                  else {
                    updatedSampleList = updatedSampleList.map(item => item.filter(element => element[4] >= 65));
                  }
                  
                  let testList = updatedSampleList.map(item => item.filter(element => element[4] >= 70));
                  let testcount = 0;
                  for (let k = 0; k < testList.length; k += 1) {
                    if (testList[k].length > 0) {
                      testcount += 1;
                    }
                  }
                  if (testcount > 0) {
                    updatedSampleList = updatedSampleList.map(item => item.filter(element => element[4] >= 70));
                  }
                  testList = updatedSampleList.map(item => item.filter(element => element[4] >= 75));
                  testcount = 0;
                  for (let k = 0; k < testList.length; k += 1) {
                    if (testList[k].length > 0) {
                      testcount += 1;
                    }
                  }
                  if (testcount > 0) {
                    updatedSampleList = updatedSampleList.map(item => item.filter(element => element[4] >= 75));
                  }
                  testList = updatedSampleList.map(item => item.filter(element => element[4] >= 80));
                  testcount = 0;
                  for (let k = 0; k < testList.length; k += 1) {
                    if (testList[k].length > 0) {
                      testcount += 1;
                    }
                  }
                  if (testcount > 0) {
                    updatedSampleList = updatedSampleList.map(item => item.filter(element => element[4] >= 80));
                  }
                  testList = updatedSampleList.map(item => item.filter(element => element[4] >= 85));
                  testcount = 0;
                  for (let k = 0; k < testList.length; k += 1) {
                    if (testList[k].length > 0) {
                      testcount += 1;
                    }
                  }
                  if (testcount > 0) {
                    updatedSampleList = updatedSampleList.map(item => item.filter(element => element[4] >= 85));
                  }
                  testList = updatedSampleList.map(item => item.filter(element => element[4] >= 90));
                  testcount = 0;
                  for (let k = 0; k < testList.length; k += 1) {
                    if (testList[k].length > 0) {
                      testcount += 1;
                    }
                  }
                  if (testcount > 0) {
                    updatedSampleList = updatedSampleList.map(item => item.filter(element => element[4] >= 90));
                  }

                  // filter by min_H + 2 <= H
                  min_H = 120;
                  for (let i = 0; i < updatedSampleList.length; i += 1) {
                    for (let j = 0; j < updatedSampleList[i].length; j += 1) {
                      let h_intensity = 0;
                      if (updatedSampleList[i][j][3] <= 60) {
                        h_intensity = updatedSampleList[i][j][3] + 60;
                      }
                      else {
                        h_intensity = updatedSampleList[i][j][3] - 300;
                      }
                      if (h_intensity < min_H) {
                        min_H = h_intensity;
                      }
                    }
                  }
                  updatedSampleList = updatedSampleList.map(item => item.filter(element => hueMinRange(element[3], min_H) === 1));

                  // update V as 75 if V > 75
                  max_V = 0;
                  for (let i = 0; i < updatedSampleList.length; i += 1) {
                    for (let j = 0; j < updatedSampleList[i].length; j += 1) {
                      if (updatedSampleList[i][j][5] > max_V) {
                        max_V = updatedSampleList[i][j][5];
                      }
                    }
                  }
                  if (max_V > 75) {
                    for (let i = 0; i < updatedSampleList.length; i += 1) {
                      for (let j = 0; j < updatedSampleList[i].length; j += 1) {
                        const upd_rgb = hsvToRgb(updatedSampleList[i][j][3], updatedSampleList[i][j][4], 75);
                        const upd_color_j = [upd_rgb.r, upd_rgb.g, upd_rgb.b, updatedSampleList[i][j][3], updatedSampleList[i][j][4], 75];
                        // Replace it in the structure
                        updatedSampleList[i] = [...updatedSampleList[i]];
                        updatedSampleList[i][j] = upd_color_j;
                      }
                    }
                  }
                
                }
                
              }
            }
          }
        }
        else if (selectedLabel == "SIBURI+") {
          // do nothing
        }
        
        for (let i = 0; i < updatedSampleList.length; i += 1) {
          if (updatedSampleList[i].length === 0) continue;

          let validPixelCount = 0;
          let sampleRed = 0;
          let sampleGreen = 0;
          let sampleBlue = 0;
          
          for (let j = 0; j < updatedSampleList[i].length; j += 1) {
            if (updatedSampleList[i][j][4] >= maxSaturation) {
              validPixelCount += 1;
              sampleRed += updatedSampleList[i][j][0];
              sampleGreen += updatedSampleList[i][j][1];
              sampleBlue += updatedSampleList[i][j][2];
            }
          }
          
          if (validPixelCount > 0) {
            avgRed = sampleRed / validPixelCount;
            avgGreen = sampleGreen / validPixelCount;
            avgBlue = sampleBlue / validPixelCount;
            const { h, s, v } = rgbToHsv(avgRed, avgGreen, avgBlue);
            const prod_sv = s * v;
            const valid_i = {ravg: avgRed, gavg: avgGreen, bavg: avgBlue, sv: prod_sv};
            newValidColors.push(valid_i);
          }
        }

        //alert('valid_in_tube: ' + newValidColors.length);
        
        // Use newValidColors (local variable)
        for (let i = 0; i < updatedSampleList.length; i += 1) {
          let validPixelCount = 0;
          let sampleRed = 0;
          let sampleGreen = 0;
          let sampleBlue = 0;
          
          for (let j = 0; j < updatedSampleList[i].length; j += 1) {
            validPixelCount += 1;
            sampleRed += updatedSampleList[i][j][0];
            sampleGreen += updatedSampleList[i][j][1];
            sampleBlue += updatedSampleList[i][j][2];
          }
          
          avgRed = sampleRed / validPixelCount;
          avgGreen = sampleGreen / validPixelCount;
          avgBlue = sampleBlue / validPixelCount;
          const { h, s, v } = rgbToHsv(avgRed, avgGreen, avgBlue);
          const prod_sv = s * v;
          const valid_i = {ravg: avgRed, gavg: avgGreen, bavg: avgBlue, sv: prod_sv};
          //const valid_i = {ravg: avgRed, gavg: avgGreen, bavg: avgBlue, sv: s};
          newValidColors.push(valid_i);
        }
        //alert('currentSaturation: ' + currentSaturation + " " + newValidColors.length);
        
        if (newValidColors.length === 0) {
          clearMagnifier();
          setSampleColorList([]);
          setNewColor(false);
          setSelectString('3. Select samples for test tube');
          return;
        }

        // Detect the color with highest s * v
        let highest_sv = 0;
        for (let k = 1; k < newValidColors.length; k += 1) {
          if (newValidColors[k].sv > newValidColors[highest_sv].sv) {
            highest_sv = k;
          }
        }
        avgRed = newValidColors[highest_sv].ravg;
        avgGreen = newValidColors[highest_sv].gavg;
        avgBlue = newValidColors[highest_sv].bavg;

        if (colors.length >= 100) {
          alert("Only 100 selections can be made!");
          // Still need to reset state before returning
          setSampleColorList([]);
          setNewColor(false);
          return;
        }

        setColors((prev) => [
          ...prev,
          {
            r: Math.round(avgRed),
            g: Math.round(avgGreen),
            b: Math.round(avgBlue),
            type: selectedLabel,
          },
        ]);
        //alert(JSON.stringify(colors));
        const temp1 = {
          r: Math.round(avgRed),
          g: Math.round(avgGreen),
          b: Math.round(avgBlue),
        };
        nColor.push(temp1);
        //alert(JSON.stringify(nColor));

        clearMagnifier();
        setAnnotations((prev) => [...prev, ""]);
        // Update all state at the end
        setSampleColorList([]);
        setNewColor(false);
        
        return;
      }
    }

    if ((newColor == true)) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      let rect = canvas.getBoundingClientRect();
      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;

      const imageData = context?.getImageData(
        x - Math.floor(samplingSize / 2),
        y - Math.floor(samplingSize / 2),
        samplingSize,
        samplingSize
      );

      // Build newIndvColors array
      const newIndvColors = [];
      for (let i = 0; i < imageData.data.length; i += 4) {
        const { h, s, v } = rgbToHsv(imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]);
        const new_rgb = hsvToRgb(h, s, v);
        const color_i = [new_rgb.r, new_rgb.g, new_rgb.b, h, s, v];
        newIndvColors.push(color_i);
      }
      
      // Update state with the new sample
      setSampleColorList(prev => [...prev, newIndvColors]);
      
      // Optional: If you need to see the updated list immediately
      // const updatedSampleList = [...sampleColorList, newIndvColors];
      // alert(JSON.stringify(updatedSampleList));  // Shows updated data
      // alert(`Total samples: ${updatedSampleList.length}`);

      // Clean up magnified canvas
      clearMagnifier();
      
      // Update annotations
      setAnnotations(prev => [...prev, ""]);
    }
  };

  /**
   * Handles canvas hover event and displays a magnified view of the selected area.
   * @param {Object} e - The event object representing the canvas hover.
   */
  const handleCanvasHover = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.style.cursor = "pointer";

    // 1. Remove existing magnifier using the Ref to avoid "ghosting"
    if (magnifiedRef.current) {
      if (document.body.contains(magnifiedRef.current)) {
        document.body.removeChild(magnifiedRef.current);
      }
      magnifiedRef.current = null;
    }

    // 2. Calculate coordinates relative to the canvas
    let rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    // 3. Create the new magnified canvas element
    const newMagnifiedCanvas = document.createElement("canvas");
    newMagnifiedCanvas.width = samplingSize * magnificationFactor;
    newMagnifiedCanvas.height = samplingSize * magnificationFactor;
    const magnifiedContext = newMagnifiedCanvas.getContext("2d");

    // 4. Draw the zoomed-in portion of the main canvas
    // We use Math.round to ensure we are grabbing sharp pixel boundaries
    magnifiedContext.imageSmoothingEnabled = false; // Keeps pixels sharp
    magnifiedContext.drawImage(
      canvas,
      Math.round(x - Math.floor(samplingSize / 2)),
      Math.round(y - Math.floor(samplingSize / 2)),
      samplingSize,
      samplingSize,
      0,
      0,
      samplingSize * magnificationFactor,
      samplingSize * magnificationFactor
    );

    // 5. Apply styles and position it near the cursor
    newMagnifiedCanvas.id = "magni";
    newMagnifiedCanvas.style.position = "absolute";
    newMagnifiedCanvas.style.left = e.pageX + 10 + "px";
    newMagnifiedCanvas.style.top = e.pageY + "px";
    newMagnifiedCanvas.style.border = "2px solid red";
    newMagnifiedCanvas.style.pointerEvents = "none"; // Ensures the magnifier doesn't block clicks
    newMagnifiedCanvas.style.zIndex = "9999";

    // 6. Append to body and update the Ref
    document.body.appendChild(newMagnifiedCanvas);
    magnifiedRef.current = newMagnifiedCanvas;

    // 7. Hover text: show sample count when selection mode is active
    //    and hide once the count reaches the colorSampling limit
    const selectionActive = newColor;
    const limitReached = sampleColorList.length >= Number(colorSampling);

    // Remove any existing hover text first
    if (hoverTextRef.current) {
      if (document.body.contains(hoverTextRef.current)) {
        document.body.removeChild(hoverTextRef.current);
      }
      hoverTextRef.current = null;
    }

    if (selectionActive && !limitReached) {
      const magnifiedHeight = samplingSize * magnificationFactor;

      const hoverText = document.createElement("div");
      hoverText.textContent = `${sampleColorList.length} / ${colorSampling}`;
      hoverText.style.position = "absolute";
      // Position it just below the magnified canvas
      hoverText.style.left = e.pageX + 10 + "px";
      hoverText.style.top = e.pageY + magnifiedHeight + 4 + "px";
      hoverText.style.background = "rgba(0, 0, 0, 0.7)";
      hoverText.style.color = "white";
      hoverText.style.fontSize = "0.9rem";
      hoverText.style.fontWeight = "bold";
      hoverText.style.fontFamily = "monospace";
      hoverText.style.padding = "2px 7px";
      hoverText.style.borderRadius = "4px";
      hoverText.style.pointerEvents = "none";
      hoverText.style.zIndex = "10000";
      hoverText.style.whiteSpace = "nowrap";
      hoverText.style.letterSpacing = "0.04em";

      document.body.appendChild(hoverText);
      hoverTextRef.current = hoverText;
    }
  };

  /**
   * Handles canvas leave event and removes the magnified canvas.
   */
  const handleCanvasLeave = () => {
    const canvas = canvasRef.current;
    canvas.style.cursor = "default";

    if (magnifiedRef.current) {
      document.body.removeChild(magnifiedRef.current);
      magnifiedRef.current = null;
    }

    // Remove hover text on leave
    if (hoverTextRef.current) {
      if (document.body.contains(hoverTextRef.current)) {
        document.body.removeChild(hoverTextRef.current);
      }
      hoverTextRef.current = null;
    }
  };

  /**
   * Removes all annotations
   */ 
  const handleRemoveImage = () => {
    setImage(null);
    setAnnotations([]);
    setColors([]);
    setNewColor(false);
    setTubeCount(0);
  };

  /**
   * Effect hook to handle image loading and resizing based on the parent container size.
   */
  useEffect(() => {
    const canvas = canvasRef?.current;
    const context = canvas?.getContext("2d");

    /**
     * Handles resizing of the canvas based on the parent container size.
     */
    const handleResize = () => {
      if (!image) {
        setColors([]);
        setTubeCount(0);
        return;
      }

      const img = new Image();
      img.src = image;

      const parentWidth = canvas.parentElement.clientWidth;
      const canvasWidth = 1.0 * parentWidth; // Set to 100% of parent width
      const scale = canvasWidth / img.width;

      const drawWidth = img.width * scale;
      const drawHeight = img.height * scale;

      //const drawWidth = img.width;
      //const drawHeight = img.height;

      canvas.width = drawWidth;
      canvas.height = drawHeight;

      context?.clearRect(0, 0, canvas.width, canvas.height);
      context?.drawImage(img, 0, 0, drawWidth, drawHeight);
    };

    /**
     * Loads the image and initializes resizing.
     */
    const loadImage = () => {
      if (image) {
        const img = new Image();
        img.src = image;

        img.onload = () => {
          handleResize();
        };
      }
    };

    handleResize();
    loadImage();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [image]);

  /**
   * Calculates intensity based on the given color.
   * @param {Object} color - The color object containing RGB values.
   * @returns {number} - The intensity value ranging from 0 to 1.
   */
  const calculateIntensity = (color) => {
    const r = color?.r;
    const g = color?.g;
    const b = color?.b;
    
    const { h, s, v } = rgbToHsv(r, g, b);

    // Use the mode the color was analyzed with, not the current radio selection
    const retLabel = color?.type ?? selectedLabel;

    if (retLabel == "SIBURI") {
      let cfu_ml = ''; // "10⁰" "10³" "10⁴" "10⁵" "10⁶"

      let h_intensity = 0;
      if (h <= 60) {
        h_intensity = h + 60;
      }
      else if (h >= 300) {
        h_intensity = h - 300;
      }

      if (h_intensity <= 62) { // magenta
        if (h_intensity >= 57) {
          if (s >= 70) {
            cfu_ml = '10⁵';
          }
          else if (s >= 40) {
            cfu_ml = '10⁴';
          }
          else {
            cfu_ml = '10³➜10⁴';
          }
        }
        else {
          if (s >= 40) {
            cfu_ml = '10⁴';
          }
          else {
            cfu_ml = '10³➜10⁴';
          }
        }
      }
      else if (h_intensity < 90) { // orange
        if (s >= 60) {
          cfu_ml = '10⁵';
        }
        else if (s >= 40) {
          if (h_intensity <= 75) {
            if (v > 65) {
              cfu_ml = '10⁴';
            }
            else {
              cfu_ml = '10⁵';
            }
          }
          else {
            cfu_ml = '10⁵';
          }
        }
        else {
          if (h_intensity <= 82) {
            cfu_ml = '10³➜10⁴';
          }
          else {
            cfu_ml = '10⁰➜10³';
          }
        }
      }
      else if (h_intensity >= 90) { // yellow
        if (s >= 35) {
          cfu_ml = '>=10⁶';
        }
        else {
          cfu_ml = '10⁰➜10³';
        }
      }
      return cfu_ml;
    }

    else if (retLabel == "SIBURI+") {
      if (h >= 160) {
        return 'Neg';
      }
      else {
        return 'Pos';
      }
    }
  };

  const printPDF = async () => {
    // -----------------------------------------------------------------
    // 1. Run only in the browser
    // -----------------------------------------------------------------
    if (typeof window === 'undefined') return;

    const el = document.getElementById('pdf-content');
    if (!el) {
      console.error('PDF content element not found');
      return;
    }

    // -----------------------------------------------------------------
    // 2. UI feedback
    // -----------------------------------------------------------------
    const btn = document.querySelector('button[data-pdf]');
    const oldText = btn ? btn.textContent : null;
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Generating PDF…';
    }

    try {
      // -----------------------------------------------------------------
      // 3. Dynamic import – NEVER runs on the server
      // -----------------------------------------------------------------
      const html2pdfModule = await import('html2pdf.js');

      // html2pdf.js exports a *function* as default
      const html2pdf = html2pdfModule.default;

      // Get the current date and time
      const now = new Date();
      
      // Format it (e.g., YYYY-MM-DD_HH-MM-SS)
      const timestamp = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + '_' +
        String(now.getHours()).padStart(2, '0') + '-' +
        String(now.getMinutes()).padStart(2, '0') + '-' +
        String(now.getSeconds()).padStart(2, '0');

      const opt = {
        margin: 0.5,
        filename: `SIBURI_Report_${timestamp}.pdf`,
        image: { type: 'png', quality: 1.0 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        pagebreak: { mode: 'css' }
      };

      // -----------------------------------------------------------------
      // 4. Generate & download
      // -----------------------------------------------------------------
      await html2pdf().set(opt).from(el).save();

      // Success – nothing to do
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF open the console for details.');
    } finally {
      // -----------------------------------------------------------------
      // 5. Restore button
      // -----------------------------------------------------------------
      if (btn) {
        btn.disabled = false;
        btn.textContent = oldText || 'PDF';
      }
    }
  };

  // Handle 'n' key press to enable selection
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Safety check: don't trigger if user is typing in the Feedback form
      const isTyping = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
      
      if (event.key.toLowerCase() === 'n' && !isTyping) {
        // Only trigger if an image is actually loaded
        if (image) {
          handleNewColor();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup: removes the listener when the component is destroyed
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearMagnifier(); // Clean up the red box on unmount
    };
  }, [handleNewColor, image, clearMagnifier]); // Syncs with image presence and logic changes

  //console.log(annotations, "annotation");

  return (
    <div className={styles.wrapper}>
      <div className={styles.leftColumn}>
      
        <h1 className={styles.headingText}>SIBURI</h1>
        <h5 className={styles.headingText} 
          style={{ backgroundColor: '#d8e6f5', padding: '8px',borderRadius: '4px' }}>
          Significant bacteriuria (SIBURI) denotes urine that has over 100,000 bacteria per mL, which confirms a real infection.
          Finding it early helps in giving antibiotics only when truly needed, and choose the right one.
        </h5>
        <p className={styles.Help}>
          Help <span onClick={() => setIsModalOpen(true)}>i</span>
        </p>
        
        <div style={{display:"flex", justifyContent:"start", gap:"1rem",height:"9rem",fontSize:".7rem"}}>
          <div style={{width:"150%",boxShadow:"5px 5px 20px #d3d3d3", padding:"1rem", borderRadius:".5rem"}}>
            <p style={{color: "black"}}>Set sampling size
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              Set magnification size</p>
            
            {/* Container for the two sliders in the same row */}
            <div style={{display: "flex", gap: "2rem", alignItems: "center"}}>
              <div className={styles.range_slider}>
                <input
                  className={styles.range_slider__range}
                  type="range"
                  value={samplingSize}
                  onChange={(e) => setSamplingSize(e.target.value)}
                  min="1"
                  max="5"
                />
                <span className={styles.range_slider__value}>{samplingSize}</span>
              </div>
              
              <div className={styles.range_slider}>
                <input
                  className={styles.range_slider__range}
                  type="range"
                  value={magnificationFactor}
                  onChange={(e) => setMagnificationFactor(e.target.value)}
                  min="1"
                  max="60"
                />
                <span className={styles.range_slider__value}>
                  {magnificationFactor}
                </span>
              </div>
            </div>
            
            <div className={styles.range_slider}>
              <p>Set total samples for a tube</p>
              <input
                className={styles.range_slider__range}
                type="range"
                value={colorSampling}
                onChange={handleSampleCount}
                min="7"
                max="10"
              />
              <span className={styles.range_slider__value}>
                {colorSampling}
              </span>
            </div>
          </div>
        </div>

        <div style={{display:"flex", justifyContent:"start", gap:"1rem",height:"9.5rem",fontSize:".7rem"}}>
          <div style={{width:"200%",boxShadow:"5px 5px 20px #d3d3d3", padding:"1rem", borderRadius:".rem"} }>
            <div className={styles.formSection}>
              <p>1. Select an image (E.g. JPEG / PNG file)</p>
              {image ? (
                <button
                  /* onClick={() => setImage(null)} */
                  onClick={handleRemoveImage}
                  className={styles.remove}
                >
                  Remove
                </button>
              ) : (
                <label className={styles.label}>
                  Select
                  <input
                    className={styles.input}
                    onChange={handleFileInput}
                    type="file"
                    accept="image/*"
                  />
                </label>
              )}
            </div>

            <div className={styles.formSection}>
              <p style={{ marginTop: "30px" }}>2. Select type </p>
              <div className={styles.colorsection} style={{
                  minHeight: "auto",
                  width: "100%",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: "24px",
                  flexWrap: "wrap",
                }}
              >
                {siburiOptions.map((option) => (
                  <div
                    key={option.id}
                    style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
                  >
                    <input
                      type="radio"
                      id={option.id}
                      name="siburi-type"
                      value={option.value}
                      checked={siburiType === option.value}
                      onChange={(e) => setSiburiType(e.target.value)}
                      style={{ cursor: "pointer" }}
                    />
                    <label htmlFor={option.id} style={{ cursor: "pointer", userSelect: "none" }}>
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div style={{display:"flex", justifyContent:"start", gap:"1rem",height:"7rem",fontSize:".7rem"}}>
          <div style={{width:"200%",boxShadow:"5px 5px 20px #d3d3d3", padding:"1rem", borderRadius:".rem"} }>
            <div className={styles.formSection}>
              <p>
                {selectString}
              </p>
              {image && (
                <button className={styles.remove} onClick={() => handleNewColor()}>
                  Enable Selection [N]
                </button>
              )}
              { (newColor) && (
                <p>
                  {sampleColorList.length > 0 
                    ? <>Samples selected: <span style={{fontWeight: "bold", fontSize: ".8rem"}}>{sampleColorList.length}</span></> 
                    : "No samples selected"}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className={styles.formSection} style={{width:"100%"}}>
          <p>
            4. View selected{" "}
            <span
              style={colors.length >= 100 ? { color: "red" } : {}}
            >{`(${colors.length}/100)`}</span>
          </p>
          <div className={styles.colorsection} style={{marginRight: "-10px"}} id="selectedColor">
            {colors.map((color, index) => (
              <Color
                key={index}
                color={color}
                rank={
                  calculateIntensity(color) === "Pos" ? "SIBURI" :
                  calculateIntensity(color) === "Neg" ? "SIBURI" :
                  "SIBURI+"
                }
                setColors={setColors}
                fReport={
                  calculateIntensity(color)}
                setAnnotations={setAnnotations}
                index={index + 1}
                annotations={annotations}
              />
            ))}
          </div>
          {/*<button
            className={styles.remove}
            onClick={() => setFormstate((prev) => !prev)}
          >
            FeedBack Form
          </button>*/}
          {colors.length > 0 && (
            <button
              data-pdf          // marker for the script
              className={styles.remove}
              onClick={printPDF}>
              PDF
            </button>
          )}
        </div>
        <div style={{width:"100%",display:"flex",gap:"1.5rem",marginTop:"1rem"}}>
        <div>
        {/* use Image component  */}
            <img
              src="/DPT.jpg"
              alt="DPT logo"
              style={{ width: "4rem", height: "3rem" }}
            />
          </div>
          <p style={{color:"black"}}>
          © 2026 Diagopreutic Private Limited
          </p>
        </div>
      </div>
      
      {/* Hidden printable PDF area */}
      <div style={{ display: 'none' }}>
        <div id="pdf-content" style={{ 
          width: '100%', 
          minHeight: '100vh',
          padding: '50px 30px',
          backgroundColor: 'white'
        }}>
          <div style={{width:"100%",display:"flex",gap:"1.5rem",marginTop:"0rem"}}>
            <div>
            {/* use Image component  */}
                <img
                  src="/DPT.jpg"
                  alt="DPT logo"
                  style={{ width: "10rem", height: "6rem" }}
                />
            </div>
          </div>

          <table style={{ width: '100%', margin: '1rem 0 1rem' }}>
            <thead>
              <tr>
                <th style={{ 
                  textAlign: 'center', 
                  fontSize: '20px', 
                  padding: '20px',
                  color: '#201f1f',
                }}>Selected Colors</th>
              </tr>
            </thead>
          </table>
          
          {colors.length > 0 && (() => {
            //const colors_sort = sortSelected(colors, annotations);
            const colors_sort = arrangeSelected(colors, annotations);
            //alert(`Selected Colors: ${JSON.stringify(colors_sort)}`);
            return (
            <><div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
              {colors_sort[0].map((color, idx) => {
                return (
                  <div
                    key={idx}
                    style={{
                      background: `rgb(${color.r},${color.g},${color.b})`,
                      width: '45%',
                      minHeight: '3rem',
                      borderRadius: '4px',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                      color: colors_sort[2][idx],
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 1rem',
                      pageBreakInside: 'avoid',
                      breakInside: 'avoid',
                      overflow: 'hidden',
                    }}
                  >
                    <span>
                    {/*{annotations[idx + 1] || ''}</span>*/}
                    {colors_sort[1][idx] || ''}</span>
                    <span>{calculateIntensity(color)}</span>
                  </div>
                );
              })}
            </div>
            
            </>
            );
          })()}
        </div>
      </div>

      <div className={styles.rightColumn}>
        {(image && (
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasHover}
            onMouseLeave={handleCanvasLeave}
          ></canvas>
        )) ||
          (formstate && <FeedbackForm />)}
      </div>
      {<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default SiburiApp;
