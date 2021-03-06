/*
 * Copyright 2017 Barclays Africa Group Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// SL-115
// SL-38

db.lineages
    .find({_ver: 1})
    .forEach(function (lineage) {
        var V3 = NumberInt(3)

        function toV3Child(o, i) {
            o._ver = V3
            o._lineageId = lineage._id
            o._index = NumberInt(i)
            o._id = o._id || o.mainProps._id
        }

        function toV3Operation(o, i) {
            toV3Child(o, i)
            if (o.sources) o.sources.forEach(function (src) {
                src.datasetsIds = src.datasetId ? [src.datasetId] : []
                delete src.datasetId
            })
        }

        lineage.operations.forEach(toV3Operation)
        lineage.datasets.forEach(toV3Child)
        lineage.attributes.forEach(toV3Child)
        lineage.operations[0].append = false

        db.operations.insert(lineage.operations)
        db.datasets.insert(lineage.datasets)
        db.attributes.insert(lineage.attributes)

        db.lineages.update(
            {_id: lineage._id},
            {
                $set: {
                    _ver: V3,
                    rootOperation: lineage.operations[0],
                    rootDataset: lineage.datasets[0]
                },
                $unset: {
                    operations: "",
                    datasets: "",
                    attributes: ""
                }
            }
        );
    });

db.lineages.createIndex({"rootDataset._id": 1})
db.lineages.createIndex({"rootOperation.path": 1, "appId": 1})
db.lineages.createIndex({"timestamp": 1})

db.operations.createIndex({"_lineageId": 1})
db.operations.createIndex({"sources.datasetsIds": 1})

db.datasets.createIndex({"_lineageId": 1})
db.attributes.createIndex({"_lineageId": 1})