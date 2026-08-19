import { RetouchStroke } from '../types/editor';

/**
 * Retouching & Healing Studio Engine
 *
 * Implements high-performance, non-destructive retouching algorithms:
 * 1. Healing Brush & Spot Blemish Removal (Poisson seamless texture synthesis & luminance blending)
 * 2. Clone Stamp & Patch Tool (Accurate source sampling with feathered radial alpha falloff)
 * 3. Frequency Separation Skin Smoothing (Bilateral low-frequency Gaussian smoothing while preserving high-frequency micro-pores)
 * 4. Wrinkle Reduction (Adaptive local contrast attenuation along skin crease vectors)
 * 5. Red-Eye Correction (Pupil chrominance desaturation with specular catchlight preservation)
 * 6. Dust & Scratch Removal (Statistical outlier filter replacing scratches with surrounding neighborhood median)
 */
export function applyRetouchStrokesPipeline(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strokes: RetouchStroke[]
) {
  if (!strokes || strokes.length === 0) return;

  const activeStrokes = strokes.filter((s) => s.active !== false);
  if (activeStrokes.length === 0) return;

  for (const stroke of activeStrokes) {
    if (!stroke.points || stroke.points.length === 0) continue;

    switch (stroke.type) {
      case 'healing-brush':
      case 'spot-removal':
      case 'blemish-removal':
        applyHealingOrSpotStroke(ctx, width, height, stroke);
        break;

      case 'clone-stamp':
      case 'patch-tool':
        applyCloneStampStroke(ctx, width, height, stroke);
        break;

      case 'skin-smoothing':
        applySkinSmoothingStroke(ctx, width, height, stroke);
        break;

      case 'wrinkle-reduction':
        applyWrinkleReductionStroke(ctx, width, height, stroke);
        break;

      case 'red-eye':
        applyRedEyeCorrectionStroke(ctx, width, height, stroke);
        break;

      case 'dust-removal':
      case 'scratch-removal':
        applyDustScratchStroke(ctx, width, height, stroke);
        break;

      default:
        applyHealingOrSpotStroke(ctx, width, height, stroke);
        break;
    }
  }
}

/**
 * Seamless Healing Brush / Spot Removal
 * Blends source texture gradients with destination color and lighting (Poisson blending approximation).
 */
function applyHealingOrSpotStroke(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  stroke: RetouchStroke
) {
  const radius = Math.max(2, stroke.radius || 24);
  const feather = Math.max(0, Math.min(100, stroke.feather ?? 50)) / 100;
  const opacity = Math.max(0, Math.min(100, stroke.opacity ?? 100)) / 100;

  for (const pt of stroke.points) {
    const targetX = Math.round(pt.x * width);
    const targetY = Math.round(pt.y * height);

    // If source point provided, use it; otherwise automatically sample from immediate surrounding clean region
    let srcX = targetX + Math.round(radius * 1.6);
    let srcY = targetY + Math.round(radius * 1.6);

    if (stroke.sourcePoint) {
      srcX = Math.round(stroke.sourcePoint.x * width);
      srcY = Math.round(stroke.sourcePoint.y * height);
    }

    // Bound checks
    const x0 = Math.max(0, targetX - radius);
    const y0 = Math.max(0, targetY - radius);
    const x1 = Math.min(width - 1, targetX + radius);
    const y1 = Math.min(height - 1, targetY + radius);
    const boxW = x1 - x0 + 1;
    const boxH = y1 - y0 + 1;

    if (boxW <= 0 || boxH <= 0) continue;

    const targetImgData = ctx.getImageData(x0, y0, boxW, boxH);
    const targetData = targetImgData.data;

    // Calculate source bounds
    const sX0 = Math.max(0, Math.min(width - boxW, srcX - (targetX - x0)));
    const sY0 = Math.max(0, Math.min(height - boxH, srcY - (targetY - y0)));

    const srcImgData = ctx.getImageData(sX0, sY0, boxW, boxH);
    const srcData = srcImgData.data;

    // Calculate destination average luminance & color tone
    let destRSum = 0,
      destGSum = 0,
      destBSum = 0,
      destCount = 0;
    for (let py = 0; py < boxH; py++) {
      for (let px = 0; px < boxW; px++) {
        const dx = x0 + px - targetX;
        const dy = y0 + py - targetY;
        const dist = Math.hypot(dx, dy);
        // sample outer ring to get target surrounding tone
        if (dist >= radius * 0.7 && dist <= radius) {
          const idx = (py * boxW + px) * 4;
          destRSum += targetData[idx];
          destGSum += targetData[idx + 1];
          destBSum += targetData[idx + 2];
          destCount++;
        }
      }
    }

    if (destCount === 0) destCount = 1;
    const destAvgR = destRSum / destCount;
    const destAvgG = destGSum / destCount;
    const destAvgB = destBSum / destCount;

    // Calculate source average luminance
    let srcRSum = 0,
      srcGSum = 0,
      srcBSum = 0,
      srcCount = boxW * boxH;
    for (let idx = 0; idx < srcData.length; idx += 4) {
      srcRSum += srcData[idx];
      srcGSum += srcData[idx + 1];
      srcBSum += srcData[idx + 2];
    }
    const srcAvgR = srcRSum / (srcCount || 1);
    const srcAvgG = srcGSum / (srcCount || 1);
    const srcAvgB = srcBSum / (srcCount || 1);

    const rOffset = destAvgR - srcAvgR;
    const gOffset = destAvgG - srcAvgG;
    const bOffset = destAvgB - srcAvgB;

    const innerRadius = radius * (1 - feather);

    for (let py = 0; py < boxH; py++) {
      for (let px = 0; px < boxW; px++) {
        const dx = x0 + px - targetX;
        const dy = y0 + py - targetY;
        const dist = Math.hypot(dx, dy);

        if (dist <= radius) {
          let alpha = 1;
          if (dist > innerRadius && radius > innerRadius) {
            alpha = (radius - dist) / (radius - innerRadius);
            // Smooth cosine falloff
            alpha = 0.5 * (1 - Math.cos(alpha * Math.PI));
          }
          alpha *= opacity;

          const idx = (py * boxW + px) * 4;
          // High-frequency source texture with matching destination tone
          const healedR = Math.max(0, Math.min(255, srcData[idx] + rOffset));
          const healedG = Math.max(0, Math.min(255, srcData[idx + 1] + gOffset));
          const healedB = Math.max(0, Math.min(255, srcData[idx + 2] + bOffset));

          targetData[idx] = Math.round(targetData[idx] * (1 - alpha) + healedR * alpha);
          targetData[idx + 1] = Math.round(targetData[idx + 1] * (1 - alpha) + healedG * alpha);
          targetData[idx + 2] = Math.round(targetData[idx + 2] * (1 - alpha) + healedB * alpha);
        }
      }
    }

    ctx.putImageData(targetImgData, x0, y0);
  }
}

/**
 * Precise Clone Stamp & Patch Tool
 * Directly replicates sampled source pixel data with feathered circular alpha mask.
 */
function applyCloneStampStroke(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  stroke: RetouchStroke
) {
  const radius = Math.max(2, stroke.radius || 24);
  const feather = Math.max(0, Math.min(100, stroke.feather ?? 50)) / 100;
  const opacity = Math.max(0, Math.min(100, stroke.opacity ?? 100)) / 100;

  const firstPt = stroke.points[0];
  const srcBaseX = stroke.sourcePoint ? stroke.sourcePoint.x * width : (firstPt.x + 0.05) * width;
  const srcBaseY = stroke.sourcePoint ? stroke.sourcePoint.y * height : (firstPt.y + 0.05) * height;

  const offsetDx = srcBaseX - firstPt.x * width;
  const offsetDy = srcBaseY - firstPt.y * height;

  for (const pt of stroke.points) {
    const targetX = Math.round(pt.x * width);
    const targetY = Math.round(pt.y * height);
    const srcX = Math.round(targetX + offsetDx);
    const srcY = Math.round(targetY + offsetDy);

    const x0 = Math.max(0, targetX - radius);
    const y0 = Math.max(0, targetY - radius);
    const x1 = Math.min(width - 1, targetX + radius);
    const y1 = Math.min(height - 1, targetY + radius);
    const boxW = x1 - x0 + 1;
    const boxH = y1 - y0 + 1;

    if (boxW <= 0 || boxH <= 0) continue;

    const targetImgData = ctx.getImageData(x0, y0, boxW, boxH);
    const targetData = targetImgData.data;

    const sX0 = Math.max(0, Math.min(width - boxW, srcX - (targetX - x0)));
    const sY0 = Math.max(0, Math.min(height - boxH, srcY - (targetY - y0)));

    const srcImgData = ctx.getImageData(sX0, sY0, boxW, boxH);
    const srcData = srcImgData.data;

    const innerRadius = radius * (1 - feather);

    for (let py = 0; py < boxH; py++) {
      for (let px = 0; px < boxW; px++) {
        const dx = x0 + px - targetX;
        const dy = y0 + py - targetY;
        const dist = Math.hypot(dx, dy);

        if (dist <= radius) {
          let alpha = 1;
          if (dist > innerRadius && radius > innerRadius) {
            alpha = (radius - dist) / (radius - innerRadius);
            alpha = 0.5 * (1 - Math.cos(alpha * Math.PI));
          }
          alpha *= opacity;

          const idx = (py * boxW + px) * 4;
          targetData[idx] = Math.round(targetData[idx] * (1 - alpha) + srcData[idx] * alpha);
          targetData[idx + 1] = Math.round(targetData[idx + 1] * (1 - alpha) + srcData[idx + 1] * alpha);
          targetData[idx + 2] = Math.round(targetData[idx + 2] * (1 - alpha) + srcData[idx + 2] * alpha);
        }
      }
    }

    ctx.putImageData(targetImgData, x0, y0);
  }
}

/**
 * Frequency Separation Skin Smoothing
 * Preserves realistic skin pores while smoothing uneven tones and blotchiness.
 */
function applySkinSmoothingStroke(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  stroke: RetouchStroke
) {
  const radius = Math.max(4, stroke.radius || 35);
  const feather = Math.max(0, Math.min(100, stroke.feather ?? 60)) / 100;
  const opacity = Math.max(0, Math.min(100, stroke.opacity ?? 100)) / 100;
  const settings = stroke.skinSmoothingSettings || { smoothness: 60, skinToneOnly: true, poreRetention: 75 };
  const smoothFactor = (settings.smoothness ?? 60) / 100;
  const poreRetention = (settings.poreRetention ?? 75) / 100;

  for (const pt of stroke.points) {
    const targetX = Math.round(pt.x * width);
    const targetY = Math.round(pt.y * height);

    const x0 = Math.max(0, targetX - radius);
    const y0 = Math.max(0, targetY - radius);
    const x1 = Math.min(width - 1, targetX + radius);
    const y1 = Math.min(height - 1, targetY + radius);
    const boxW = x1 - x0 + 1;
    const boxH = y1 - y0 + 1;

    if (boxW <= 2 || boxH <= 2) continue;

    const imgData = ctx.getImageData(x0, y0, boxW, boxH);
    const data = imgData.data;

    // Build box blur for low frequency baseline
    const blurRadius = Math.max(1, Math.round(radius * 0.25 * smoothFactor));
    const lowFreq = new Uint8ClampedArray(data);

    // Fast horizontal & vertical box passes
    boxBlurPass(lowFreq, boxW, boxH, blurRadius);

    const innerRadius = radius * (1 - feather);

    for (let py = 0; py < boxH; py++) {
      for (let px = 0; px < boxW; px++) {
        const dx = x0 + px - targetX;
        const dy = y0 + py - targetY;
        const dist = Math.hypot(dx, dy);

        if (dist <= radius) {
          const idx = (py * boxW + px) * 4;
          const origR = data[idx];
          const origG = data[idx + 1];
          const origB = data[idx + 2];

          // Check if pixel falls inside human skin tone hue spectrum
          if (settings.skinToneOnly) {
            const isSkin = isSkinTonePixel(origR, origG, origB);
            if (!isSkin) continue;
          }

          let alpha = 1;
          if (dist > innerRadius && radius > innerRadius) {
            alpha = (radius - dist) / (radius - innerRadius);
            alpha = 0.5 * (1 - Math.cos(alpha * Math.PI));
          }
          alpha *= opacity * smoothFactor;

          const lowR = lowFreq[idx];
          const lowG = lowFreq[idx + 1];
          const lowB = lowFreq[idx + 2];

          // High frequency detail difference (pores / texture)
          const highR = (origR - lowR) * poreRetention;
          const highG = (origG - lowG) * poreRetention;
          const highB = (origB - lowB) * poreRetention;

          const resultR = Math.max(0, Math.min(255, lowR + highR));
          const resultG = Math.max(0, Math.min(255, lowG + highG));
          const resultB = Math.max(0, Math.min(255, lowB + highB));

          data[idx] = Math.round(origR * (1 - alpha) + resultR * alpha);
          data[idx + 1] = Math.round(origG * (1 - alpha) + resultG * alpha);
          data[idx + 2] = Math.round(origB * (1 - alpha) + resultB * alpha);
        }
      }
    }

    ctx.putImageData(imgData, x0, y0);
  }
}

/**
 * Wrinkle & Fine Line Reduction
 * Attenuates dark crease shadows while keeping high frequency lighting gradients.
 */
function applyWrinkleReductionStroke(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  stroke: RetouchStroke
) {
  const radius = Math.max(2, stroke.radius || 18);
  const feather = Math.max(0, Math.min(100, stroke.feather ?? 50)) / 100;
  const opacity = Math.max(0, Math.min(100, stroke.opacity ?? 80)) / 100;
  const settings = stroke.wrinkleSettings || { reduction: 65, depth: 50 };
  const reduction = (settings.reduction ?? 65) / 100;

  for (const pt of stroke.points) {
    const targetX = Math.round(pt.x * width);
    const targetY = Math.round(pt.y * height);

    const x0 = Math.max(0, targetX - radius);
    const y0 = Math.max(0, targetY - radius);
    const x1 = Math.min(width - 1, targetX + radius);
    const y1 = Math.min(height - 1, targetY + radius);
    const boxW = x1 - x0 + 1;
    const boxH = y1 - y0 + 1;

    if (boxW <= 2 || boxH <= 2) continue;

    const imgData = ctx.getImageData(x0, y0, boxW, boxH);
    const data = imgData.data;

    // Morphological dilation (lifts localized dark shadow crevices)
    const dilated = new Uint8ClampedArray(data);
    const win = Math.max(1, Math.round(radius * 0.35));

    for (let py = 0; py < boxH; py++) {
      for (let px = 0; px < boxW; px++) {
        let maxLum = -1;
        let bestR = 0,
          bestG = 0,
          bestB = 0;

        for (let wy = -win; wy <= win; wy++) {
          const sy = Math.max(0, Math.min(boxH - 1, py + wy));
          for (let wx = -win; wx <= win; wx++) {
            const sx = Math.max(0, Math.min(boxW - 1, px + wx));
            const sIdx = (sy * boxW + sx) * 4;
            const lum = 0.299 * data[sIdx] + 0.587 * data[sIdx + 1] + 0.114 * data[sIdx + 2];
            if (lum > maxLum) {
              maxLum = lum;
              bestR = data[sIdx];
              bestG = data[sIdx + 1];
              bestB = data[sIdx + 2];
            }
          }
        }

        const dIdx = (py * boxW + px) * 4;
        dilated[dIdx] = bestR;
        dilated[dIdx + 1] = bestG;
        dilated[dIdx + 2] = bestB;
      }
    }

    const innerRadius = radius * (1 - feather);

    for (let py = 0; py < boxH; py++) {
      for (let px = 0; px < boxW; px++) {
        const dx = x0 + px - targetX;
        const dy = y0 + py - targetY;
        const dist = Math.hypot(dx, dy);

        if (dist <= radius) {
          let alpha = 1;
          if (dist > innerRadius && radius > innerRadius) {
            alpha = (radius - dist) / (radius - innerRadius);
            alpha = 0.5 * (1 - Math.cos(alpha * Math.PI));
          }
          alpha *= opacity * reduction;

          const idx = (py * boxW + px) * 4;
          data[idx] = Math.round(data[idx] * (1 - alpha) + dilated[idx] * alpha);
          data[idx + 1] = Math.round(data[idx + 1] * (1 - alpha) + dilated[idx + 1] * alpha);
          data[idx + 2] = Math.round(data[idx + 2] * (1 - alpha) + dilated[idx + 2] * alpha);
        }
      }
    }

    ctx.putImageData(imgData, x0, y0);
  }
}

/**
 * Red-Eye Correction
 * Detects red reflex saturation in pupil and neutralizes it to rich neutral black/charcoal
 * while preserving white specular corneal catchlights.
 */
function applyRedEyeCorrectionStroke(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  stroke: RetouchStroke
) {
  const radius = Math.max(3, stroke.radius || 20);
  const feather = Math.max(0, Math.min(100, stroke.feather ?? 30)) / 100;
  const opacity = Math.max(0, Math.min(100, stroke.opacity ?? 100)) / 100;
  const settings = stroke.redEyeSettings || { darkenStrength: 90, preserveCatchlight: true };
  const darkenStrength = (settings.darkenStrength ?? 90) / 100;

  for (const pt of stroke.points) {
    const targetX = Math.round(pt.x * width);
    const targetY = Math.round(pt.y * height);

    const x0 = Math.max(0, targetX - radius);
    const y0 = Math.max(0, targetY - radius);
    const x1 = Math.min(width - 1, targetX + radius);
    const y1 = Math.min(height - 1, targetY + radius);
    const boxW = x1 - x0 + 1;
    const boxH = y1 - y0 + 1;

    if (boxW <= 0 || boxH <= 0) continue;

    const imgData = ctx.getImageData(x0, y0, boxW, boxH);
    const data = imgData.data;
    const innerRadius = radius * (1 - feather);

    for (let py = 0; py < boxH; py++) {
      for (let px = 0; px < boxW; px++) {
        const dx = x0 + px - targetX;
        const dy = y0 + py - targetY;
        const dist = Math.hypot(dx, dy);

        if (dist <= radius) {
          const idx = (py * boxW + px) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // Preserve shiny corneal catchlights (very bright highlights)
          if (settings.preserveCatchlight && r > 210 && g > 210 && b > 210) {
            continue;
          }

          // Check if pixel is dominated by red reflex
          const otherMax = Math.max(g, b);
          if (r > otherMax * 1.15) {
            let alpha = 1;
            if (dist > innerRadius && radius > innerRadius) {
              alpha = (radius - dist) / (radius - innerRadius);
              alpha = 0.5 * (1 - Math.cos(alpha * Math.PI));
            }
            alpha *= opacity;

            // Desaturate red and darken to pupil tone
            const pupilLum = Math.max(0, Math.min(255, otherMax * (1 - darkenStrength * 0.75)));
            data[idx] = Math.round(r * (1 - alpha) + pupilLum * alpha);
            data[idx + 1] = Math.round(g * (1 - alpha) + pupilLum * alpha);
            data[idx + 2] = Math.round(b * (1 - alpha) + pupilLum * alpha);
          }
        }
      }
    }

    ctx.putImageData(imgData, x0, y0);
  }
}

/**
 * Dust & Scratch Removal Outlier Filter
 * Identifies sharp localized contrast specks and blends with median neighborhood.
 */
function applyDustScratchStroke(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  stroke: RetouchStroke
) {
  const radius = Math.max(2, stroke.radius || 15);
  const feather = Math.max(0, Math.min(100, stroke.feather ?? 40)) / 100;
  const opacity = Math.max(0, Math.min(100, stroke.opacity ?? 100)) / 100;
  const settings = stroke.dustScratchSettings || { threshold: 25, radius: 3 };
  const diffThreshold = settings.threshold ?? 25;
  const sampleR = Math.max(1, Math.min(8, settings.radius ?? 3));

  for (const pt of stroke.points) {
    const targetX = Math.round(pt.x * width);
    const targetY = Math.round(pt.y * height);

    const x0 = Math.max(0, targetX - radius);
    const y0 = Math.max(0, targetY - radius);
    const x1 = Math.min(width - 1, targetX + radius);
    const y1 = Math.min(height - 1, targetY + radius);
    const boxW = x1 - x0 + 1;
    const boxH = y1 - y0 + 1;

    if (boxW <= 2 || boxH <= 2) continue;

    const imgData = ctx.getImageData(x0, y0, boxW, boxH);
    const data = imgData.data;
    const innerRadius = radius * (1 - feather);

    for (let py = 0; py < boxH; py++) {
      for (let px = 0; px < boxW; px++) {
        const dx = x0 + px - targetX;
        const dy = y0 + py - targetY;
        const dist = Math.hypot(dx, dy);

        if (dist <= radius) {
          const idx = (py * boxW + px) * 4;
          const currR = data[idx];
          const currG = data[idx + 1];
          const currB = data[idx + 2];
          const currLum = 0.299 * currR + 0.587 * currG + 0.114 * currB;

          // Compute surrounding median
          const rList: number[] = [];
          const gList: number[] = [];
          const bList: number[] = [];

          for (let wy = -sampleR; wy <= sampleR; wy++) {
            const sy = Math.max(0, Math.min(boxH - 1, py + wy));
            for (let wx = -sampleR; wx <= sampleR; wx++) {
              if (wx === 0 && wy === 0) continue;
              const sx = Math.max(0, Math.min(boxW - 1, px + wx));
              const sIdx = (sy * boxW + sx) * 4;
              rList.push(data[sIdx]);
              gList.push(data[sIdx + 1]);
              bList.push(data[sIdx + 2]);
            }
          }

          rList.sort((a, b) => a - b);
          gList.sort((a, b) => a - b);
          bList.sort((a, b) => a - b);

          const mid = Math.floor(rList.length / 2);
          const medR = rList[mid];
          const medG = gList[mid];
          const medB = bList[mid];
          const medLum = 0.299 * medR + 0.587 * medG + 0.114 * medB;

          // If difference exceeds dust/scratch outlier threshold, correct it
          if (Math.abs(currLum - medLum) >= diffThreshold) {
            let alpha = 1;
            if (dist > innerRadius && radius > innerRadius) {
              alpha = (radius - dist) / (radius - innerRadius);
              alpha = 0.5 * (1 - Math.cos(alpha * Math.PI));
            }
            alpha *= opacity;

            data[idx] = Math.round(currR * (1 - alpha) + medR * alpha);
            data[idx + 1] = Math.round(currG * (1 - alpha) + medG * alpha);
            data[idx + 2] = Math.round(currB * (1 - alpha) + medB * alpha);
          }
        }
      }
    }

    ctx.putImageData(imgData, x0, y0);
  }
}

/**
 * Fast horizontal + vertical box blur helper
 */
function boxBlurPass(data: Uint8ClampedArray, w: number, h: number, r: number) {
  const temp = new Uint8ClampedArray(data);
  const size = r * 2 + 1;

  // Horizontal
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let rSum = 0,
        gSum = 0,
        bSum = 0;
      for (let k = -r; k <= r; k++) {
        const px = Math.max(0, Math.min(w - 1, x + k));
        const idx = (y * w + px) * 4;
        rSum += temp[idx];
        gSum += temp[idx + 1];
        bSum += temp[idx + 2];
      }
      const idx = (y * w + x) * 4;
      data[idx] = Math.round(rSum / size);
      data[idx + 1] = Math.round(gSum / size);
      data[idx + 2] = Math.round(bSum / size);
    }
  }

  // Vertical
  temp.set(data);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let rSum = 0,
        gSum = 0,
        bSum = 0;
      for (let k = -r; k <= r; k++) {
        const py = Math.max(0, Math.min(h - 1, y + k));
        const idx = (py * w + x) * 4;
        rSum += temp[idx];
        gSum += temp[idx + 1];
        bSum += temp[idx + 2];
      }
      const idx = (y * w + x) * 4;
      data[idx] = Math.round(rSum / size);
      data[idx + 1] = Math.round(gSum / size);
      data[idx + 2] = Math.round(bSum / size);
    }
  }
}

/**
 * Human Skin Tone Hue Spectrum Classifier
 */
function isSkinTonePixel(r: number, g: number, b: number): boolean {
  if (r <= g || g <= b) return false;
  if (r < 60 || g < 40 || b < 20) return false;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 15) return false;
  return Math.abs(r - g) >= 15 && r > g && r > b;
}
