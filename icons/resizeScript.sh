#!/usr/bin/env bash

INPUT_DIR="./in"
OUTPUT_DIR="./out"

SIZE_1X=20
SIZE_2X=40

mkdir -p "$OUTPUT_DIR"

for svg in "$INPUT_DIR"/*.svg; do
  base_name=$(basename "$svg" .svg)

  # 1x (16x16) -> baseName.svg
  sed -E \
    -e 's/width="[^"]*"/width="'"$SIZE_1X"'"/g' \
    -e 's/height="[^"]*"/height="'"$SIZE_1X"'"/g' \
    -e 's/fill="[^"]*"/fill="#ffffff"/g' \
    "$svg" > "$OUTPUT_DIR/${base_name}.svg"

  # 2x (40x40) -> baseName@2x.svg
  sed -E \
    -e 's/width="[^"]*"/width="'"$SIZE_2X"'"/g' \
    -e 's/height="[^"]*"/height="'"$SIZE_2X"'"/g' \
    -e 's/fill="[^"]*"/fill="#ffffff"/g' \
    "$svg" > "$OUTPUT_DIR/${base_name}@2x.svg"
done
