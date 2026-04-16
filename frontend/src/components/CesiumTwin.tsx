import { useEffect, useRef } from "react";
import {
  Viewer,
  Cartesian3,
  Color,
  LabelStyle,
  VerticalOrigin,
  Cartesian2,
  HeightReference,
  defined,
  Ion,
  createWorldTerrainAsync,
  EllipsoidTerrainProvider,
  createOsmBuildingsAsync,
  ScreenSpaceEventType,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

import { colorFor } from "../lib/aqi";
import type { StationReading } from "../lib/types";


const DELHI = Cartesian3.fromDegrees(77.20, 28.61, 15000);


interface Props {
  stations: Record<string, StationReading>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function CesiumTwin({ stations, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const entityMapRef = useRef<Record<string, any>>({});

  // Boot the viewer once
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    const token = import.meta.env.VITE_CESIUM_ION_TOKEN as string | undefined;
    if (token) Ion.defaultAccessToken = token;

    const initViewer = async () => {
      const useIon = !!token;
      const viewer = new Viewer(containerRef.current!, {
        terrainProvider: useIon
          ? await createWorldTerrainAsync()
          : new EllipsoidTerrainProvider(),
        baseLayerPicker: false,
        navigationHelpButton: false,
        homeButton: false,
        sceneModePicker: false,
        geocoder: false,
        timeline: false,
        animation: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
      });

      viewer.scene.globe.enableLighting = true;
      if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = true;
      viewer.scene.fog.enabled = true;
      (viewer.scene.globe as any).baseColor = Color.fromCssColorString("#0a1220");

      viewer.camera.flyTo({
        destination: DELHI,
        duration: 1.2,
        orientation: { heading: 0.3, pitch: -0.65, roll: 0 },
      });

      if (useIon) {
        try {
          const buildings = await createOsmBuildingsAsync();
          viewer.scene.primitives.add(buildings);
        } catch (e) {
          // ignore if Ion asset blocked
          console.warn("OSM buildings failed:", e);
        }
      }

      viewer.screenSpaceEventHandler.setInputAction((click: any) => {
        const picked = viewer.scene.pick(click.position);
        if (defined(picked) && picked.id && picked.id.stationId) {
          onSelect(picked.id.stationId);
        } else {
          onSelect(null);
        }
      }, ScreenSpaceEventType.LEFT_CLICK);

      viewerRef.current = viewer;
    };

    initViewer().catch(console.error);
    return () => {
      viewerRef.current?.destroy();
      viewerRef.current = null;
      entityMapRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync station entities on each stations change
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    for (const reading of Object.values(stations)) {
      const existing = entityMapRef.current[reading.station_id];
      const color = Color.fromCssColorString(colorFor(reading.aqi));
      const position = Cartesian3.fromDegrees(reading.lng, reading.lat, 60);
      const isSelected = selectedId === reading.station_id;
      const isHotspot = reading.aqi > 300;

      if (existing) {
        existing.position = position;
        existing.point.color = color;
        existing.point.pixelSize = isSelected ? 22 : isHotspot ? 18 : 13;
        existing.point.outlineColor = isSelected
          ? Color.CYAN
          : isHotspot
          ? Color.WHITE.withAlpha(0.8)
          : Color.BLACK.withAlpha(0.3);
        existing.label.text = `${reading.station_name}\nAQI ${reading.aqi}`;
        existing.label.fillColor = color;
      } else {
        const entity = viewer.entities.add({
          name: reading.station_name,
          position,
          point: {
            color,
            pixelSize: isHotspot ? 18 : 13,
            outlineColor: isHotspot ? Color.WHITE.withAlpha(0.8) : Color.BLACK.withAlpha(0.3),
            outlineWidth: 2,
            heightReference: HeightReference.RELATIVE_TO_GROUND,
          },
          label: {
            text: `${reading.station_name}\nAQI ${reading.aqi}`,
            font: "12px monospace",
            fillColor: color,
            outlineColor: Color.BLACK,
            outlineWidth: 2,
            style: LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: VerticalOrigin.BOTTOM,
            pixelOffset: new Cartesian2(0, -22),
            showBackground: true,
            backgroundColor: Color.fromCssColorString("#0d1422").withAlpha(0.85),
            backgroundPadding: new Cartesian2(6, 4),
          },
        });
        (entity as any).stationId = reading.station_id;
        entityMapRef.current[reading.station_id] = entity;
      }
    }
  }, [stations, selectedId]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-cmd-bg"
      style={{ minHeight: 400 }}
    />
  );
}
