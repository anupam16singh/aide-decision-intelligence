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
  CallbackProperty,
  ColorMaterialProperty,
  JulianDate,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

import { grayFor, intensityFor } from "../lib/aqi";
import type { StationReading } from "../lib/types";

const DELHI = Cartesian3.fromDegrees(77.20, 28.61, 22000);

interface Props {
  stations: Record<string, StationReading>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

interface EntityBundle {
  marker: any;
  halo: any;
}

export function CesiumTwin({ stations, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const entityMapRef = useRef<Record<string, EntityBundle>>({});
  const stationsRef = useRef<Record<string, StationReading>>(stations);

  useEffect(() => {
    stationsRef.current = stations;
  }, [stations]);

  // Boot once
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

      viewer.scene.globe.enableLighting = false;
      if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = false;
      viewer.scene.fog.enabled = true;
      viewer.scene.backgroundColor = Color.fromCssColorString("#000000");
      (viewer.scene.globe as any).baseColor = Color.fromCssColorString("#050505");
      viewer.scene.globe.showGroundAtmosphere = false;

      viewer.camera.flyTo({
        destination: DELHI,
        duration: 1.2,
        orientation: { heading: 0.3, pitch: -0.7, roll: 0 },
      });

      if (useIon) {
        try {
          const buildings = await createOsmBuildingsAsync();
          viewer.scene.primitives.add(buildings);
        } catch (e) {
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

  // Sync entities each tick
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    for (const reading of Object.values(stations)) {
      const bundle = entityMapRef.current[reading.station_id];
      const position = Cartesian3.fromDegrees(reading.lng, reading.lat, 40);
      const gray = grayFor(reading.aqi);
      const intensity = intensityFor(reading.aqi);
      const isSelected = selectedId === reading.station_id;
      const isHotspot = reading.aqi > 300;
      const radiusMeters = 1500 + intensity * 4500;

      if (bundle) {
        bundle.marker.position = position;
        bundle.marker.point.color = Color.fromCssColorString(gray);
        bundle.marker.point.pixelSize = isSelected ? 18 : isHotspot ? 14 : 10;
        bundle.marker.point.outlineColor = isSelected
          ? Color.WHITE
          : Color.fromCssColorString("#3a3a3a");
        bundle.marker.point.outlineWidth = isSelected ? 2 : 1;
        bundle.marker.label.text = `${reading.station_name.toUpperCase()}\nAQI ${reading.aqi}`;
        bundle.marker.label.fillColor = Color.fromCssColorString(
          isHotspot ? "#ffffff" : "#d4d4d4",
        );

        bundle.halo.position = position;
        bundle.halo.ellipse.semiMajorAxis = radiusMeters;
        bundle.halo.ellipse.semiMinorAxis = radiusMeters;
      } else {
        const sid = reading.station_id;

        const halo = viewer.entities.add({
          name: `halo:${sid}`,
          position,
          ellipse: {
            semiMajorAxis: radiusMeters,
            semiMinorAxis: radiusMeters,
            height: 0,
            material: new ColorMaterialProperty(
              new CallbackProperty(() => {
                const r = stationsRef.current[sid];
                if (!r) return Color.fromCssColorString("#303030").withAlpha(0.05);
                const g = grayFor(r.aqi);
                const inten = intensityFor(r.aqi);
                const base = 0.08 + inten * 0.35;
                const pulse =
                  r.aqi > 300
                    ? 0.15 *
                      Math.abs(
                        Math.sin(
                          (JulianDate.now().secondsOfDay * 2 * Math.PI) / 2.2,
                        ),
                      )
                    : 0;
                return Color.fromCssColorString(g).withAlpha(base + pulse);
              }, false),
            ),
            outline: false,
          },
        });

        const marker = viewer.entities.add({
          name: reading.station_name,
          position,
          point: {
            color: Color.fromCssColorString(gray),
            pixelSize: isHotspot ? 14 : 10,
            outlineColor: Color.fromCssColorString("#3a3a3a"),
            outlineWidth: 1,
            heightReference: HeightReference.RELATIVE_TO_GROUND,
          },
          label: {
            text: `${reading.station_name.toUpperCase()}\nAQI ${reading.aqi}`,
            font: "10px 'JetBrains Mono', ui-monospace, monospace",
            fillColor: Color.fromCssColorString("#d4d4d4"),
            outlineColor: Color.BLACK,
            outlineWidth: 3,
            style: LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: VerticalOrigin.BOTTOM,
            pixelOffset: new Cartesian2(0, -18),
            showBackground: true,
            backgroundColor: Color.fromCssColorString("#0a0a0a").withAlpha(0.9),
            backgroundPadding: new Cartesian2(6, 4),
          },
        });
        (marker as any).stationId = sid;
        entityMapRef.current[sid] = { marker, halo };
      }
    }
  }, [stations, selectedId]);

  return (
    <div className="relative w-full h-full bg-cmd-bg">
      <div ref={containerRef} className="absolute inset-0" style={{ minHeight: 400 }} />

      {/* Crosshair overlay */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-4 top-4 right-4 bottom-4 border border-cmd-border/60" />
        <div className="absolute left-1/2 top-4 bottom-4 w-px bg-cmd-border/30" />
        <div className="absolute top-1/2 left-4 right-4 h-px bg-cmd-border/30" />
      </div>

      {/* Heatmap legend (top-left) */}
      <div className="pointer-events-none absolute top-3 left-3 border border-cmd-border bg-cmd-bg/80 backdrop-blur-sm px-3 py-2">
        <div className="text-2xs font-mono uppercase tracking-[0.18em] text-cmd-muted mb-1.5">
          AQI Heat
        </div>
        <div
          className="h-1.5 w-40"
          style={{
            background:
              "linear-gradient(90deg, #555 0%, #888 30%, #bbb 60%, #e8e8e8 85%, #fff 100%)",
          }}
        />
        <div className="flex items-center justify-between text-2xs font-mono text-cmd-muted mt-1 w-40">
          <span>0</span>
          <span>200</span>
          <span>500+</span>
        </div>
      </div>

      {/* Corner telemetry */}
      <div className="pointer-events-none absolute bottom-3 right-3 border border-cmd-border bg-cmd-bg/80 backdrop-blur-sm px-3 py-2 text-2xs font-mono text-cmd-muted tracking-[0.14em]">
        <div>DELHI · 28.61°N · 77.20°E</div>
        <div className="text-cmd-dim">
          {Object.keys(stations).length} nodes · grayscale · 3D terrain
        </div>
      </div>
    </div>
  );
}
