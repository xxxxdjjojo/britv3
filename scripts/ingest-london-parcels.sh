#!/usr/bin/env bash
# Ingest all Greater London INSPIRE parcels into public.parcels.
# Expects per-council GML already downloaded+unzipped under $LONDON_DIR
# (default ~/Downloads/sold-parcels-data/london/<Council>/Land_Registry_Cadastral_Parcels.gml).
# Idempotent: ingest-inspire.ts upserts on inspire_id. Run from the repo root.
# Portable (bash 3.2 / zsh): mapping is a here-doc, not an associative array.
#
#   bash scripts/ingest-london-parcels.sh
set -uo pipefail

LONDON_DIR="${LONDON_DIR:-$HOME/Downloads/sold-parcels-data/london}"

# dir|lad_cd|lad_name  (ONS E09 codes)
MAPPING="$(cat <<'EOF'
City_of_London_Corporation|E09000001|City of London
London_Borough_of_Barking_and_Dagenham|E09000002|Barking and Dagenham
London_Borough_of_Barnet|E09000003|Barnet
London_Borough_of_Bexley|E09000004|Bexley
London_Borough_of_Brent|E09000005|Brent
London_Borough_of_Bromley|E09000006|Bromley
London_Borough_of_Camden|E09000007|Camden
London_Borough_of_Croydon|E09000008|Croydon
London_Borough_of_Ealing|E09000009|Ealing
London_Borough_of_Enfield|E09000010|Enfield
Royal_Borough_of_Greenwich|E09000011|Greenwich
London_Borough_of_Hackney|E09000012|Hackney
London_Borough_of_Hammersmith_and_Fulham|E09000013|Hammersmith and Fulham
London_Borough_of_Haringey|E09000014|Haringey
London_Borough_of_Harrow|E09000015|Harrow
London_Borough_of_Havering|E09000016|Havering
London_Borough_of_Hillingdon|E09000017|Hillingdon
London_Borough_of_Hounslow|E09000018|Hounslow
London_Borough_of_Islington|E09000019|Islington
Royal_Borough_of_Kensington_and_Chelsea|E09000020|Kensington and Chelsea
Royal_Borough_of_Kingston_upon_Thames|E09000021|Kingston upon Thames
London_Borough_of_Lambeth|E09000022|Lambeth
London_Borough_of_Lewisham|E09000023|Lewisham
London_Borough_of_Merton|E09000024|Merton
London_Borough_of_Newham|E09000025|Newham
London_Borough_of_Redbridge|E09000026|Redbridge
London_Borough_of_Richmond_upon_Thames|E09000027|Richmond upon Thames
London_Borough_of_Southwark|E09000028|Southwark
London_Borough_of_Sutton|E09000029|Sutton
London_Borough_of_Tower_Hamlets|E09000030|Tower Hamlets
London_Borough_of_Waltham_Forest|E09000031|Waltham Forest
London_Borough_of_Wandsworth|E09000032|Wandsworth
City_of_Westminster|E09000033|Westminster
EOF
)"

ok=0; fail=0
while IFS='|' read -r dir code name; do
  [ -z "$dir" ] && continue
  gml="$LONDON_DIR/$dir/Land_Registry_Cadastral_Parcels.gml"
  if [ ! -f "$gml" ]; then echo "MISSING $dir"; fail=$((fail+1)); continue; fi
  echo "=== $name ($code) ==="
  node --experimental-strip-types scripts/ingest-inspire.ts \
       --gml "$gml" --lad-cd "$code" --lad-name "$name" --commit 2>&1 \
       | grep -vE "MODULE_TYPELESS|Reparsing|trace-warnings|eliminate" \
       | grep -E "Parsed|Done|FATAL" | tail -2
  ok=$((ok+1))
done <<< "$MAPPING"
echo "=== LONDON PARCELS DONE: $ok processed, $fail missing ==="
