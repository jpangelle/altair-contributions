# Altair Contribitions

This repo uses `subvis-io`'s [subquery graph](https://explorer.subquery.network/subquery/subvis-io/kusama-auction) to get the contribution data for the Altair parachain crowdloan on Kusama. Contributions from the same account are summed up and combined. Contributions are sorted in descending order. The service runs every five minutes and data is uploaded to a Mongo database.
