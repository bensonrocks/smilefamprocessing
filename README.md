# Smilefam Order Processing Tool

Run the app with the included Node server. The tool accepts CSV exports pasted or uploaded from:

- Client order sheet: date, order reference, customer, phone, address, item free text, quantity, tracking.
- SharePoint master list: alias/permutation, canonical SKU, component SKU/name, units per quantity, skip/exclude flag.

Click **Retrieve orders** to fetch the latest client Google Sheet and display the client records for the selected date or date range. Tick the rows you want to fulfil, then click **Process selected** to generate matching, picklist, and labels. Manual CSV upload/paste remains available for fallback processing.

For local use, run `npm start` and open `http://127.0.0.1:4173/`. The server only serves this tool and proxies `docs.google.com` CSV requests so browser CORS does not block the refresh.

After exporting labels/picklist for a batch, click **Mark batch processed**. The app records those order keys in `processed-orders.json`, and future retrieves for the same date window hold them back so repeated processing during the day only shows new orders.

The current inventory and default master mapping are seeded from `SMILEFAM Inventory.xlsx`: `StockCount` supplies dashboard stock balances, and `Master List` supplies the free-text-to-pick-item mapping. Manual master CSV paste remains available when the workbook basis needs to be overridden.

## Railway Deployment

This app can be deployed to Railway as a Node service.

1. Push this folder to a GitHub repository.
2. In Railway, create a new project from that GitHub repository.
3. Railway should detect the Node app from `package.json`.
4. Use `npm start` as the start command if Railway asks.
5. Railway will supply the `PORT` environment variable automatically.

Important: `processed-orders.json` stores the processed-order register used to prevent repeated fulfilment. On Railway, normal container files can reset on redeploy. For production use, attach persistent storage or replace `processed-orders.json` with a small database so every staff member sees the same processed-order history.

## GitHub Pages Deployment

GitHub Pages can host the app as a static site.

1. Upload the extracted project files to the repository root. Do not upload only the zip file.
2. In GitHub, open `Settings` > `Pages`.
3. Under `Build and deployment`, choose `Deploy from a branch`.
4. Select branch `main` and folder `/root`.
5. Click `Save`.

For this repository, the staff URL will usually be:

`https://bensonrocks.github.io/smilefamprocessing/`

GitHub Pages limitation: there is no shared server/database. Processed-order tracking is saved in each staff member's own browser storage. If two staff process orders from different computers, GitHub-only hosting cannot guarantee shared duplicate prevention.

## Mapping Logic

1. Each client order row is normalized into a source line.
2. The free-text item is normalized by lowercasing, removing punctuation, and removing offer words such as `free`, `worth`, `bundle`, and `contains`.
3. The matcher checks the SharePoint master list aliases:
   - Exact normalized alias match wins.
   - Alias-contained matches are accepted.
   - Keyword coverage matches are accepted above the review threshold.
4. A matched alias can expand into one or more pick components, so bundles can generate multiple fulfilment SKUs.
5. Rows containing opt-out text such as `I will skip this` are marked as skipped and generate no pick units.
6. Unmatched lines are routed to the Review tab so the new phrase can be added to the master list.

## Outputs

- Dashboard: selected-day order count, line count, matched line count, and review count.
- Orders: generated fulfilment lines grouped by order.
- Picklist: SKU-level unit totals with source order references.
- Review: unmatched free-text rows with suggested action.
- CSV exports: generated orders and picklist.
