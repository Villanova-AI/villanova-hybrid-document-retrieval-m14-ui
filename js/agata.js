function deepCopy(obj) {
    if (obj) {
        return JSON.parse(JSON.stringify(obj));
    } else if (obj == null) {
        return null;
    } else if (obj == undefined) {
        return undefined;
    }
}

function Agata() {

    $("#addRootFolderBTN").show();

    let loadingHTML = '<div class="lds-facebook" id="loader"><div></div><div></div><div></div></div>';
    let renew = "<span class='material-icons renew'>autorenew</span>";
    let dTable = null;
    let filesUpload = {};
    let iframe = $("#documentPdf");
    let semanticAnalysisResources = [];
    let dropzone = null;
    let languageSelect = null;
    let advanceMode;
    let allRenew = false;
    let title = "";
    let loader = $("#loader");
    let table = $("#stepsTable");

    let voteMap = {};
    let splitBar = null;

    let suggest = {};

    let filesStep = {};

    let iframeReady = false;

    let defaultConfigName = "systemConfig";

    let defaultGetExpandQuery = true;
    let defaultEntity_boost = 1;
    let defaultExpansion_boost = 0.25;
    let defaultGetDebug = false;
    let defaultGetStatistics = false;
    let defaultGetCustomElasticRanges = false
    let defaultSimilarity = {
        english: "dot_product",
        //italian: "cosine"
    };

    let defaultModes = "hybrid";
    let defaultFilters = "hybrid";
    let default_top_k_docs = 10;
    let default_group_sub_passages = true;
    let default_vote_query = false;
    let default_enable_filter_button = false;
    let crossEncoderContentTypes = ["metadata + content", "content"];
    let crossEncoderContent;

    let default_metadata_template_to_title = ["collection", "filename", "title", "page"]

    let elasticFilters = {};
    let tmpElasticFilters = {};
    let activeElasticFilters = [];
    let tmpActiveElasticFilters = [];
    let crossEncoderModels = ["nreimers/mmarco-mMiniLMv2-L12-H384-v1"]

    // initialize current params
    let visualizationType = 0;

    let getExpandQuery;
    let entity_boost;
    let expansion_boost;
    let getDebug;
    let getStatistics;
    let getCustomElasticRanges;
    let similarity;

    let modes;
    let filters;
    let configList;
    let currentConfig;
    let top_k_docs;
    let group_sub_passages;
    let enable_filter_button;
    let vote_query;

    let tableForVirtualCollection;
    let virtualTable;
    let tempIdDoc;

    let metadata = [];
    let selectedMetadata = [];

    let oldQuery = "";

    let metadata_template_to_title;
    
    let metadataTemplateChoicesToTitle;

    

    this.initDefaultConfig = function () {
        getExpandQuery = defaultGetExpandQuery;
        entity_boost = defaultEntity_boost;
        expansion_boost = defaultExpansion_boost;
        getDebug = defaultGetDebug;
        getStatistics = defaultGetStatistics;
        getCustomElasticRanges = defaultGetCustomElasticRanges;
        similarity = defaultSimilarity[defaultPackLanguages[0]];

        modes = defaultModes;
        filters = defaultFilters;
        configList = [defaultConfigName];
        currentConfig = configList[0];
        top_k_docs = default_top_k_docs;
        group_sub_passages = default_group_sub_passages;

        enable_filter_button = default_enable_filter_button;
        vote_query = default_vote_query;

        $("#filterQa").hide();

        crossEncoderContent = crossEncoderContentTypes[0];
        metadata_template_to_title = default_metadata_template_to_title;

    }

    let defaultPackLanguages = ["english"];

    this.initDefaultConfig();

    let packLanguages = [];

    let languageFlags = {
        english: "us"
    }

    let langMap = {
        english: "en"
    }

    let selectpicker;

    let linespacer = '</br><div style="height: 7px;"></div>'

    let languageParameters;
    let tempLanguageParameters;
    let latestResponse;

    let storedConfigs = {};

    let virtualCollectionTable = $("#virtualCollectionTable");

    let runnningTask = null;

    this.init = function () {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);

        const id = urlParams.get('id');
        const idRoot = urlParams.get('idRoot');
        const idDoc = urlParams.get('idDoc');

        this.getVisualPDFPage();

        this.refresh();
        this.initFolders();
        this.hidenMenu();

        if (id != null) {
            $("body").append("<div id='tmp' class='openModal' href='#animatedModal'></did>");
            let breadcrumb = $("#breadcrumb");
            if (breadcrumb.find("li").length == 2) {
                breadcrumb.find("li").last().remove();
            }
            breadcrumb.append("<li class='breadcrumb-item active'>" + idRoot + "</li>");
            this.bindModal(idRoot, id, idDoc);
            $("#tmp").click();
            $("#tmp").remove();
        } else {
            this.readRoot();
        }

        let that = this;

        $('#addUserModal').on('hidden.bs.modal', function () {
            that.readRoot();
        })

        $("#titleHeader").html("Document Manager (Lab)");

        $("#switchVisualization").click(function () {
            if (visualizationType == 0) {
                $("#rootFiles").hide();
                $("#rootFilesTable").show();
                $("#switchVisualization").removeClass("fa-table");
                $("#switchVisualization").addClass("fa-th");
                $("body").resize();
                visualizationType = 1;
            } else {
                $("#switchVisualization").addClass("fa-table");
                $("#switchVisualization").removeClass("fa-th");
                $("#rootFiles").show();
                $("#rootFilesTable").hide();
                visualizationType = 0;
            }
        });

        $(window).on('click', function (e) {

            let popovers = $("[aria-describedby]").filter(function () {
                return $(this).attr("aria-describedby").includes("popover")
            })

            if (popovers.length == 0) {
                $(".popover").remove();
            } else {
                popovers.each(function () {

                    let excluded = ["batchIndexing", "addDocument", "virtualCreate", "settingQa"];
                    let classExcluded = ["addFileModal"]

                    let idExc = excluded.includes($(this).attr("id"));
                    let clsExc = false;
                    for (let cls of classExcluded) {
                        if ($(this).hasClass(cls)){
                            clsExc = true;
                            break
                        }
                    }

                    if (!(idExc || clsExc)) {
                        if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
                            $(this).popover('hide');
                        }
                    }

                });
            }

        });

    }

    this.refresh = function () {
        let that = this;
        $("body").on("click", "#refreshTable", function () {
            let idRoot = $("#breadcrumb").find("li").last().text();
            //$("#tableContainer").hide();
            that.tables(idRoot);
        });
    }

    this.getVisualPDFPage = function () {
        let that = this;

        window.addEventListener('message', function (event) {

            if (event.data) {

                console.log("Recived from Iframe -> ", event.data);

                if (event.data.click === true) {

                    let popovers = $("[aria-describedby]").filter(function () {
                        return $(this).attr("aria-describedby").includes("popover")
                    });

                    if (popovers.length == 0) {
                        $(".popover").remove();
                    } else {
                        popovers.each(function () {
                            $(this).popover('hide');
                        });
                    }

                }

                if (event.data.page) {

                    if (event.data.page == 1 && !iframeReady) {
                        iframeReady = true;
                        $(".loaderPdf").hide();
                    }
                }

                if (event.data.ready && event.data.ready == true) {
                    iframe[0].contentWindow.postMessage({
                        title: title,
                        suggest: suggest
                    }, "*");
                }

            }

        });

    }

    this.loadDeleteConfig = function (idRoot, id) {

        $("#configToDelete").select2('destroy');

        let that = this;

        let tmpHTML = '';
        tmpHTML += '    <div><div class="dz-message" data-dz-message><span> Delete Custom Configurations </span></div>' + linespacer;
        tmpHTML += '    <div style="display: flex; align-items: center; flex-direction: column;">';
        tmpHTML += '        <div style="margin: 47.5px 0;"><select id="configToDelete" class="form-control">';

        for (let i = 0; i < configList.length; i++) {
            if (configList[i] != defaultConfigName) {
                tmpHTML += "<option> " + configList[i] + " </option>";
            }
        }
        tmpHTML += '        </select></div></br>';
        tmpHTML += '        <button type="button" class="btn btn-warning btn-round deleteConfigButton">DELETE</button>';
        tmpHTML += '    </div></div>';
        tmpHTML += '    <div><div class="dz-message" data-dz-message><span> Set New Default Configuration  </span></div>' + linespacer;
        tmpHTML += '    <div style="display: flex; align-items: center; flex-direction: column;">';
        tmpHTML += '        <div style="margin: 47.5px 0;"><select id="newConfigDefault" class="form-control">';

        for (let i = 0; i < configList.length; i++) {
            if (configList[i] != defaultConfigName) {
                tmpHTML += "<option> " + configList[i] + " </option>";
            } else {
                tmpHTML += "<option selected='selected'> " + configList[i] + " </option>";
            }
        }
        tmpHTML += '        </select></div></br>';
        tmpHTML += '        <button type="button" class="btn btn-warning btn-round newConfigDefaultButton">Set as Default</button>';
        tmpHTML += '    </div></div>';

        // append buttons for import/exports
        tmpHTML += '    <div style="display: flex; justify-content: center; flex-direction: column; align-items: center;">'
        tmpHTML += '        <div class="dz-message" data-dz-message><span> Import Configuration </span></div>';
        tmpHTML += '        <form class="dropzone" id="importConfiguration" style="width: 180px; height: 155px; margin: 10px 0;">';
        tmpHTML += '            <div class="dz-message" data-dz-message>';
        tmpHTML += '                <span>Configuration JSON</span>';
        tmpHTML += '            </div>';
        tmpHTML += '        </form>'
        tmpHTML += '        <button id="importConfig" type="button" class="btn btn-warning btn-round">Upload</button>';
        tmpHTML += '    </div>';
        tmpHTML += '    <div style="display: flex; justify-content: center; flex-direction: column; align-items: center;">'
        tmpHTML += '        <div class="dz-message" data-dz-message><span> Export Configuration </span></div>';
        tmpHTML += '        <div style="height: 155px; margin: 10px 0;"></div>';
        tmpHTML += '        <button id="exportConfig" type="button" class="btn btn-warning btn-round">Download</button>';
        tmpHTML += '    </div>';

        $("#configManagement").html(tmpHTML)
        $("#configToDelete").select2({ width: '50%', dropdownCssClass: "smallFont" });
        $("#newConfigDefault").select2({ width: '50%', dropdownCssClass: "smallFont" });

        $(".deleteConfigButton").unbind();
        $(".deleteConfigButton").click(function () {
            that.deleteConfig(idRoot, id, $("#configToDelete").val())
        });

        $(".newConfigDefaultButton").unbind();
        $(".newConfigDefaultButton").click(function () {
            that.setNewConfigDefault(idRoot, id, $("#newConfigDefault").val())
        });

        let configFile = null;
        let importConfigurationDropzone = new Dropzone("#importConfiguration", {
            url: "/",
            acceptedFiles: '.json',
            clickable: true,
            maxFilesize: 10000,
            uploadMultiple: true,
            autoProcessQueue: false,
            addRemoveLinks: true,
            init: function () { },
            accept: function (file, done) {
                let reader = new FileReader();
                reader.onload = function (event) {
                    configFile = {
                        name: file.name,
                        data: event.target.result.split(",")[1],
                        size: file.size
                    };
                };
                reader.readAsDataURL(file, "UTF-8");
                done();
            },
            removedfile: function (file) {
                configFile = null;
                file.previewElement.remove();
            }
        });

        $("#exportConfig").unbind();
        $("#exportConfig").click(function () {
            $.ajax({
                url: global.api_url + 'steps/' + id + "/qa/export_config_profiles",
                type: 'GET',
                dataType: 'json',
                data: {
                    idRoot: idRoot,
                },
                success: function (jsonResponse) {
                    if (jsonResponse.success === true && jsonResponse.data) {
                        saveBase64ToFile(jsonResponse.data, "config.json")
                    } else {
                        $.notify({
                            icon: "add_alert",
                            message: "Failed to export configuration"
                        }, {
                            type: 'danger',
                            timer: 3000,
                            placement: {
                                from: 'top',
                                align: 'right'
                            }
                        });
                        console.error(jsonResponse);
                    }
                },
                error: function (request) {
                    if (request.responseText) {
                        $.notify({
                            icon: "add_alert",
                            message: request.responseText
                        }, {
                            type: 'danger',
                            timer: 3000,
                            placement: {
                                from: 'top',
                                align: 'right'
                            }
                        });
                    }
                    console.error(request);
                }
            });
        });

        $("#importConfig").unbind();
        $("#importConfig").click(function () {
            if (configFile != null) {

                $.ajax({
                    url: global.api_url + 'steps/' + id + "/qa/import_config_profiles",
                    type: 'POST',
                    data: {
                        idRoot: idRoot,
                        qaConfigs: configFile.data
                    },
                    success: function (jsonResponse) {

                        jsonResponse = JSON.parse(jsonResponse);

                        if (jsonResponse.success === true) {
                            $.notify({
                                icon: "add_alert",
                                message: "Configuration successfully imported"
                            }, {
                                type: 'success',
                                timer: 3000,
                                placement: {
                                    from: 'top',
                                    align: 'right'
                                }
                            });

                            that.getConfigList(idRoot, id);
                            that.loadDeleteConfig(idRoot, id)
                            $(".configList").trigger("change")

                        } else {
                            $.notify({
                                icon: "add_alert",
                                message: "Failed to import configuration"
                            }, {
                                type: 'danger',
                                timer: 3000,
                                placement: {
                                    from: 'top',
                                    align: 'right'
                                }
                            });
                            console.error(jsonResponse);
                        }
                    },
                    error: function (request) {
                        if (request.responseText) {
                            $.notify({
                                icon: "add_alert",
                                message: request.responseText
                            }, {
                                type: 'danger',
                                timer: 3000,
                                placement: {
                                    from: 'top',
                                    align: 'right'
                                }
                            });
                        }
                        console.error(request);
                    }
                });

            } else {
                $.notify({
                    icon: "add_alert",
                    message: "Select a configuration file to import!"
                }, {
                    type: 'danger',
                    timer: 3000,
                    placement: {
                        from: 'top',
                        align: 'right'
                    }
                });
            }
        });

    }

    this.setNewConfigDefault = function (idRoot, id, config) {

        $.ajax({
            url: global.api_url + 'steps/' + id + "/qa/new_default_config",
            type: 'POST',
            dataType: 'json',
            data: {
                idRoot: idRoot,
                qaConfigName: config
            },
            success: function (jsonResponse) {

                if (jsonResponse.success === true) {

                    $.notify({
                        icon: "add_alert",
                        message: "Configuration " + config + " successfully set as default."
                    }, {
                        type: 'success',
                        timer: 3000,
                        placement: {
                            from: 'top',
                            align: 'right'
                        }
                    });

                } else {

                    if (jsonResponse.error) {
                        $.notify({
                            icon: "add_alert",
                            message: jsonResponse.error
                        }, {
                            type: 'danger',
                            timer: 3000,
                            placement: {
                                from: 'top',
                                align: 'right'
                            }
                        });
                    }
                }
            },
            error: function (request) {
                if (request.responseText) {
                    $.notify({
                        icon: "add_alert",
                        message: request.responseText
                    }, {
                        type: 'danger',
                        timer: 3000,
                        placement: {
                            from: 'top',
                            align: 'right'
                        }
                    });
                }
                console.error(request);
            }
        });
    }

    this.deleteConfig = function (idRoot, id, config) {

        let that = this;

        $.ajax({
            url: global.api_url + 'steps/' + id + "/qa/delete_config",
            type: 'DELETE',
            dataType: 'json',
            data: {
                idRoot: idRoot,
                qaConfigName: config
            },
            success: function (jsonResponse) {

                if (jsonResponse.success === true) {

                    $.notify({
                        icon: "add_alert",
                        message: "Configuration " + config + " successfully removed."
                    }, {
                        type: 'success',
                        timer: 3000,
                        placement: {
                            from: 'top',
                            align: 'right'
                        }
                    });

                    configList = configList.filter(item => item !== config);
                    that.loadDeleteConfig(idRoot, id)

                    $(".configList").find("[value=" + config + "]").remove();
                    $(".configList").trigger('change');

                    $(".configToDelete").find("[value=" + config + "]").remove();
                    $(".configToDelete").trigger('change');

                } else {

                    if (jsonResponse.error) {
                        $.notify({
                            icon: "add_alert",
                            message: jsonResponse.error
                        }, {
                            type: 'danger',
                            timer: 3000,
                            placement: {
                                from: 'top',
                                align: 'right'
                            }
                        });
                    }
                }
            },
            error: function (request) {
                if (request.responseText) {
                    $.notify({
                        icon: "add_alert",
                        message: request.responseText
                    }, {
                        type: 'danger',
                        timer: 3000,
                        placement: {
                            from: 'top',
                            align: 'right'
                        }
                    });
                }
                console.error(request);
            }
        });
    }

    this.initBatchTest = function (idRoot, id) {

        let that = this;
        let tmpHTML = '<div class="batchDropzone">';
        tmpHTML += '        <div class="dz-message" data-dz-message><span>Excel Batch Test</span></div>';
        tmpHTML += '        <form class="dropzone" id="addBatchTest">';
        tmpHTML += '            <div class="dz-message" data-dz-message><span>Load Excel file</span></div>';
        tmpHTML += '        </form>';
        tmpHTML += '        <a href="#" id="sendBatch" style="display: block; margin: 0 auto; width: 150px; margin-top: 10px;" class="btn btn-warning btn-round">';
        tmpHTML += '            SEND<div class="ripple-container"></div>';
        tmpHTML += '        </a>';
        tmpHTML += '</div><div class="batchLoader" style="display: none;"></div>';

        $("#QaBatchTest").html(tmpHTML)

        let htmlLoad = '<div class="lds-facebook">';
        htmlLoad += '<div></div>';
        htmlLoad += '<div></div>';
        htmlLoad += '<div></div>';
        htmlLoad += '</div>';
        htmlLoad += '<div style="width: 100%; display: inline-flex; text-align: center; flex-direction: column; font-weight:800;" id="loaderContent">0%</div>';

        $(".batchLoader").html(htmlLoad);

        let batchTestInsert = {};

        let dropzoneBatch = new Dropzone("#addBatchTest", {
            url: "/",
            acceptedFiles: 'application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            clickable: true,
            maxFilesize: 10000,
            uploadMultiple: false,
            autoProcessQueue: false,

            init: function () { },
            accept: function (file, done) {
                let reader = new FileReader();
                reader.onload = function (event) {

                    batchTestInsert[file.upload.uuid] = {
                        name: file.name,
                        data: event.target.result.split(",")[1],
                        size: file.size
                    };
                };
                reader.readAsDataURL(file);

                done();
            },
            removedfile: function (file) {
                delete batchTestInsert[file.upload.uuid];
                file.previewElement.remove();
            }
        });

        $("#sendBatch").off("click");
        $("#sendBatch").on("click", function () {
            let fileData;

            for (let key in batchTestInsert) {
                let value = batchTestInsert[key];
                fileData = {
                    data: value.data,
                    size: value.size,
                    name: value.name
                };
            }

            let filename = fileData.name.split(".")[0] + "_scores.xlsx";

            let batchRequest = that.buildQaRequest(fileData.data, idRoot)

            $.ajax({
                url: global.api_url + '/steps/' + id + '/qa/batch_test',
                type: 'POST',
                dataType: 'json',
                contentType: 'application/json',
                data: JSON.stringify(batchRequest),
                success: function (jsonResponse) {
                    $(".batchDropzone").hide();
                    $(".batchLoader").show();

                    dropzoneBatch.removeAllFiles();

                    if (jsonResponse.success == true && jsonResponse.batch_test_token) {

                        let interval = setInterval(function () {
                            $.ajax({
                                url: global.api_url + '/steps/qa/' + jsonResponse.batch_test_token + '/batch_test',
                                type: 'get',
                                dataType: 'json',
                                success: function (jsonResponse) {

                                    $("#loaderContent").html(Math.trunc(jsonResponse.rate * 100) + '%');

                                    if (jsonResponse.completed === true) {
                                        clearInterval(interval);
                                        $(".batchLoader").hide();
                                        $("#loaderContent").html("0%");
                                        $(".batchDropzone").show()

                                        saveBase64ToExcel(jsonResponse.table, filename)
                                    }
                                    if (jsonResponse.success === false) {
                                        $.notify({
                                            icon: "add_alert",
                                            message: jsonResponse.error
                                        }, {
                                            type: 'danger',
                                            timer: 3000,
                                            placement: {
                                                from: 'top',
                                                align: 'right'
                                            }
                                        });
                                        clearInterval(interval);
                                        $(".batchLoader").hide();
                                        $("#loaderContent").html("0%");
                                        $(".batchDropzone").show();
                                    }
                                }, error: function (request) {
                                    if (request.responseText) {
                                        $.notify({
                                            icon: "add_alert",
                                            message: request.responseText
                                        }, {
                                            type: 'danger',
                                            timer: 3000,
                                            placement: {
                                                from: 'top',
                                                align: 'right'
                                            }
                                        });
                                    }
                                    clearInterval(interval);
                                }
                            });
                        }, 500);
                    }

                }, error: function (request) {

                    dropzoneBatch.removeAllFiles();

                    if (request.responseText) {
                        $.notify({
                            icon: "add_alert",
                            message: request.responseText
                        }, {
                            type: 'danger',
                            timer: 3000,
                            placement: {
                                from: 'top',
                                align: 'right'
                            }
                        });
                    }
                    console.error(request);
                }
            });
        });

    }


    this.loadQaVote = function (id) {
        $("#qaVoteList").html("");
        let that = this;
        $.ajax({
            url: global.api_url + '/steps/' + id + "/qa/get_vote",
            type: 'GET',
            dataType: 'json',
            //contentType: 'application/json',
            success: function (jsonResponse) {
                console.log("get_vote ->", jsonResponse);

                voteMap = {};
                let objs = jsonResponse.votes;
                let text = '';
                for (let i = 0; i < jsonResponse.votes.length; i++) {
                    let obj = jsonResponse.votes[i];
                    if (!voteMap[obj.id]) {
                        voteMap[obj.id] = {};
                    }
                    voteMap[obj.id][obj.filename] = true;

                    let txt = obj.answer;
                    if (obj.answer.length > 200) {
                        txt = txt.substring(0, 200) + " ...";
                    }

                    text += '<div class="card card-chart qaList viewQaVote" id-vet="' + i + '">';
                    text += '   <div class="card-header card-header-success" style="height: 24px !important;">';
                    text += "<span class='d-inline-block text-truncate' style='max-width: calc(100% - 130px); position: absolute; top: 0;'>" + obj.question + "</span>";
                    text += '      <i class="fa fa-trash deleteQaVote" aria-hidden="true" title="Delete Vote" style="cursor: pointer; position: absolute; top: 5px; right: 6px; color: red;"></i>'
                    text += '   </div>';
                    text += '  <div class="card-body">';
                    //text += '    <h6 class="card-title" style="display: inline; font-size: 16px !important;">' + obj.question + '</h6>';
                    //text += '    <span class="card-category" style="font-weight: 700; font-size: 14px; color: #3C4858;"> (Pag. ' + obj.page + ')</span>';
                    //text += '    <p class="card-category" style="font-weight: 700;">' + obj.last_title + '</p>';
                    text += '     <p class="card-category">';
                    text += txt;
                    text += '     </p>';
                    text += '   </div>';
                    text += '   <div class="card-footer">';
                    text += '   </div>';
                    text += ' </div>';
                }

                if (text == "") {
                    text = "No query vote found!<br/>";
                }

                $("#qaVoteList").html(text);

                let htmlAdd = '<div class="" style="text-align: center;">';
                htmlAdd += '         <button type="button" class="btn btn-secondary cancelVote">No</button>';
                htmlAdd += '         <button type="button" class="btn btn-warning deleteVoteClick">Yes</button>';
                //htmlAdd += '       <i title="Delete Vote" class="deleteVoteClick fa fa-2x fa-trash" style="cursor: pointer;"></i>';
                htmlAdd += '   </div>';

                let valModal = $('.deleteQaVote').popover({
                    html: true,
                    sanitize: false,
                    content: function () {
                        return htmlAdd;
                    },
                    placement: 'right',
                    container: '#qaVoteList',
                    trigger: 'click',
                    template: '<div class="popover popoverVote" role="tooltip"><div class="arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>'
                }).on('click', function (e) {
                    e.stopPropagation();
                });

                valModal.off('shown.bs.popover');
                valModal.on('shown.bs.popover', function () {
                    let idObj = parseInt($(this).closest(".viewQaVote").attr("id-vet"));
                    let el = $(this).closest(".deleteQaVote");
                    $(".cancelVote").off();
                    $(".cancelVote").on("click", function () {
                        valModal.popover("hide");
                    });
                    //console.log("pippo");
                    $(".deleteVoteClick").off();
                    $(".deleteVoteClick").on("click", function () {

                        let obj = objs[idObj];
                        //console.log(obj);

                        el.removeClass("fa-trash");
                        el.addClass("fa-spinner");
                        el.addClass("fa-spin");

                        $.ajax({
                            url: global.api_url + '/steps/' + id + '/qa/remove_vote',
                            type: 'POST',
                            dataType: 'json',
                            //contentType: 'application/json',
                            data: {
                                answer_id: obj.id,
                                filename: obj.filename
                            },
                            success: function (jsonResponse) {
                                console.log("remove_vote response -->", jsonResponse);
                                $.notify({
                                    icon: "add_alert",
                                    message: "Vote removed!"
                                }, {
                                    type: 'success',
                                    timer: 3000,
                                    placement: {
                                        from: 'top',
                                        align: 'right'
                                    }
                                });
                                that.loadQaVote(id);
                                $("i[info='" + obj.id + obj.filename + "']").removeClass("inserted");

                            }, error: function (request) {
                                if (request.responseText) {
                                    $.notify({
                                        icon: "add_alert",
                                        message: request.responseText
                                    }, {
                                        type: 'danger',
                                        timer: 3000,
                                        placement: {
                                            from: 'top',
                                            align: 'right'
                                        }
                                    });
                                }
                                console.error(request);

                                el.removeClass("fa-spinner");
                                el.removeClass("fa-spin");
                                el.addClass("fa-trash");
                            }
                        });
                        valModal.popover("hide");
                    });
                });

                $(".viewQaVote").unbind();
                $(".viewQaVote").click(function (e) {
                    e.stopPropagation();
                    if ($(this).hasClass("select")) {
                        $(".viewQaVote").removeClass("select");
                        //$(".reference").removeClass("selectRef");
                        iframe[0].contentWindow.postMessage({
                            clear: "highlight"
                        }, "*");
                    } else {
                        $(".viewQaVote").removeClass("select");
                        //$(".reference").removeClass("selectRef");
                        $(this).addClass("select");
                        let id = parseInt($(this).attr("id-vet"));
                        let obj = objs[id];

                        let qa = {
                            start: obj.position.start,
                            end: obj.position.end,
                            highlights: [] //answerHighlights
                        };

                        if (filesStep[obj.filename].position == $("#documentsQA").val()) {
                            iframe[0].contentWindow.postMessage({
                                qa: qa
                            }, "*");
                        } else {
                            $("#documentsQA").val(filesStep[obj.filename].position);
                            $("#documentsQA").change();
                            $(".loaderPdf").show();
                            let interval = setInterval(function () {
                                if (iframeReady) {
                                    clearInterval(interval);

                                    setTimeout(function () {
                                        iframe[0].contentWindow.postMessage({
                                            qa: qa
                                        }, "*");
                                    }, 500);
                                }
                            }, 100);
                        }
                        console.log(obj);
                    }
                });

            }, error: function (request) {
                if (request.responseText) {
                    $.notify({
                        icon: "add_alert",
                        message: request.responseText
                    }, {
                        type: 'danger',
                        timer: 3000,
                        placement: {
                            from: 'top',
                            align: 'right'
                        }
                    });
                }
                console.error(request);
            }
        });
    }

    this.hidenMenu = function (enable) {
        let that = this;
        $("html").off("keydown");
        $("html").on("keydown", function (e) {
            if (e.key === "R" && e.ctrlKey && e.shiftKey) {
                e.preventDefault();
                allRenew = !allRenew;
                let txt = "";
                if (advanceMode) {
                    txt = "enabled";
                } else {
                    txt = "disabled";
                }
                $.notify({
                    icon: "add_alert",
                    message: "All ren-new mode " + txt
                }, {
                    type: 'success',
                    z_index: 2000,
                    timer: 3000,
                    placement: {
                        from: 'top',
                        align: 'right'
                    }
                });
                let idRoot = $("#breadcrumb").find("li").last().text();
                that.tables(idRoot);
            }
        });

        $("html").on("keydown", function (e) {
            if (e.key === "A" && e.ctrlKey && e.shiftKey) {
                e.preventDefault();
                advanceMode = !advanceMode;
                let txt = "";
                if (advanceMode) {
                    txt = "enabled";
                } else {
                    txt = "disabled";
                }
                $.notify({
                    icon: "add_alert",
                    message: "Advance mode " + txt
                }, {
                    type: 'success',
                    z_index: 2000,
                    timer: 3000,
                    placement: {
                        from: 'top',
                        align: 'right'
                    }
                });
            }
        });

    }

    this.getSemanticAnalysisResources = function () {

        return $.ajax({
            url: global.api_url + '/steps/qa/get_semantic_analysis_resources',
            type: 'GET',
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                if (data.success === true) {
                    semanticAnalysisResources = [];
                    for (let i = 0; i < data.resources.length; i++) {
                        semanticAnalysisResources.push({
                            name: data.resources[i]['package.name'],
                            language: data.resources[i]['package.language']
                        });
                    }
                }
            },
            error: function (request) {
                if (request.responseText) {
                    $.notify({
                        icon: "add_alert",
                        message: request.responseText
                    }, {
                        type: 'danger',
                        timer: 3000,
                        z_index: 2000,
                        placement: {
                            from: 'top',
                            align: 'right'
                        }
                    });
                }
                console.error(request);
            }
        });
    }

    this.initDropzoneDocument = function (idRoot) {
        let that = this;
        let html = '';
        html = '<div class="form-group createCollection" style="max-height: 65vh; padding-bottom: 0; display: none;">';
        html += '   <div class="labelAddDoc">DESCRIPTION:</div>';
        html += '   <input id="description" class="form-control" type="text" />';
        html += '   <div class="row">';
        html += '       <div class="card-body table-responsive col-md-6" style="margin-top: 20px; padding: 0;">';
        html += '           <div class="dz-message" data-dz-message><span>Load Documents</span></div>';
        html += '           <form class="dropzone" id="addFiles">';
        html += '               <div class="dz-message" data-dz-message><span>Documents</span></div>';
        html += '           </form>';
        html += '       </div>';
        html += '       <div class="card-body table-responsive col-md-6" style="margin-top: 20px; padding: 0;">';
        html += '           <div class="dz-message" data-dz-message><span>Load JSON Metadata</span></div>';
        html += '           <form class="dropzone" id="addFilesJson">';
        html += '               <div class="dz-message" data-dz-message><span>JSON Metadata</span></div>';
        html += '           </form>';
        html += '       </div>';
        html += '   </div>';

        html += '       <div class="row">';
        html += '           <div class="col-md-11" style="margin-left: 20px; text-align: left;">';
        html += '               <label class="form-check-label" style="display: block; position: relative; width: 100% !important;">';
        html += '                   <span class="form-check-sign">';
        html += '                       <span class="check"></span>';
        html += '                   </span>';
        html += '                   <input class="form-check-input enableFiles" type="checkbox" style="margin-top: 2px;">';
        html += '                   <span style="color: #555; margin-left: 25px;">Convert non PDF documents to PDF</span>';
        html += '               </label>';
        html += '           </div>';
        html += '       </div>';

        html += ' <div style="margin-left: 15px; margin-right: 15px;">'
        html += '   <div class="row">';
        html += '       <div class="col-md-6" style="padding-left: 0px;">';
        html += '       	<div class="labelAddDoc">CONVERSION ENGINE:</div>';
        html += '   		<select id="engine" class="form-control">';
        html += '     			<option value="PDFBOX">Pdfbox</option>';
        html += '   		</select>';
        html += '   	</div>';
        html += '       <div class="col-md-6" style="padding-left: 0px;">';
        html += '           <div class="labelAddDoc">PDFBOX OPTIONS:</div>';
        html += '           <input id="doubleColumn" class="form-check-input" type="checkbox" style="margin-left: 0px; margin-right: 4px; margin-top: 2px;">';
        html += '           <span class="form-check-sign">';
        html += '               <span class="check"></span>';
        html += '           </span>';
        html += '           <span style="color: #555; margin-left: 20px;">Force Double Column</span>';
        html += '   	</div>';
        html += '   </div>';

        html += '   <div class="labelAddDoc" style="margin-left: -15px; margin-right: -15px;">LANGUAGE:</div>';
        html += '   <select multiple id="language" style="width: 150%;">';
        html += '     <option value="english" selected="selected">English</option>';
        //html += '     <option value="italian">Italian</option>';
        //html += '     <option value="spanish">Spanish</option>';
        html += '   </select>';

        html += '   <div></br></div>';

        let allowOnlyQA = true;

        if (allowOnlyQA) {
            html += '   <div style="display: none">';
        }

        html += '   <label class="form-check-label" style="display: inline; margin-left: -15px;">';
        html += '       <span style="color: #555;">Enable QA</span>';
        html += '       <input class="form-check-input enableQa" checked type="checkbox" style="margin-left: 4px; margin-top: 2px;">';
        html += '       <span class="form-check-sign">';
        html += '           <span class="check"></span>';
        html += '       </span>';
        html += '   </label>';

        if (allowOnlyQA) {
            html += '   </div>';
        } else {
            html += '   <div></br></div>';
        }

        html += '   <span class="qaOption" style="display: none;">';

        if (!allowOnlyQA) {
            html += '       </br><div style="width: 80%; margin-left: -15px; height: 1px; background: linear-gradient(to right, black, transparent);"></div>';
            html += '       </br><div style="margin-left: -15px; margin-top: -20px; font-weight: bold;">QA</div></br>';
        }

        html += '       <label class="form-check-label" style="display: inline; margin-left: -15px;">';
        html += '           <span style="color: #555;">Indexing Segmentation Strategy</span>';
        html += '           <select id="indexSegmentation" style="margin-left: -15px; margin-right: 15px; width: calc(100% + 15px);" class="form-control">';
        //html += '               <option value="title">Title</option>';
        html += '               <option value="page">Page</option>';
        html += '               <option value="block">Block</option>';
        html += '           </select>';
        html += '   	</label>';

        html += '       <div style="margin-left: -15px;">'
        html += '           <div class="labelAddDoc">Semantic Analysis Model(s) for Indexing:</div>';
        html += '           <div class="semanticAnalysisSelects">';
        html += '               <div style="display: flex; justify-content: space-between; align-items: center;">'
        html += '                   <div class="labelAddDoc">English</div>';
        html += '                   <select id="semanticAnalysisModelsMapForIndexingEnglish" class="form-control">';

        for (let i = 0; i < semanticAnalysisResources.length; i++) {
            if (semanticAnalysisResources[i].language == langMap["english"]) {
                html += "               <option value='" + semanticAnalysisResources[i].name + "'>" + semanticAnalysisResources[i].name + '</option>';
            }
        }

        html += '                   </select>';
        html += '               </div>'
        html += '           </div>'
        html += '           <div style="display: flex; justify-content: space-between; align-items: center;">'
        html += '               <div class="labelAddDoc">Analysis Level</div>';
        html += '               <select id="semanticAnalysisMode" class="form-control">';
        html += "                   <option value> Fragment </option>";
        html += "                   <option value='segment'> Segment </option>";
        html += "                   <option value='document'> Document </option>";
        html += '               </select>';
        html += '           </div>'
        html += '       </div>'

        html += '       </br></br>';
        html += '   </span>';
        html += '   </div>';
        html += '   <div style="text-align: center; padding-bottom: 20px;">';
        html += '       <button id="sendFiles" type="button" class="btn btn-warning">Add</button>';
        html += '       <button id="cancelFiles" type="button" class="btn btn-secondary cancelDelete">Cancel</button>';
        html += '   </div>';

        let addDb = null;

        $("#virtualCreate").off("click");
        $('#virtualCreate').on("click", function () {
            $("#addVirtualCollection").modal("show");

            if (virtualTable != null) {
                virtualTable.destroy();
            }

            columns = [
                {
                    orderable: true,
                    className: 'dt-body-left',
                    width: "70%"
                },
                {
                    orderable: false,
                    width: "30%"
                }
            ]

            virtualCollectionTable.html(tableForVirtualCollection);

            virtualTable = virtualCollectionTable.DataTable({
                columns: columns,
                responsive: true,
                scrollCollapse: false,
                paging: false,
                fixedColumns: true
            });

            virtualTable.columns.adjust().draw();

            let saveVirtualCollection = $('#saveVirtualCollection').popover({
                html: true,
                sanitize: false,
                content: function () {
                    let newVirtualHtml = '';
                    newVirtualHtml += '<div style="margin-top:25px;">'
                    newVirtualHtml += '    <div style="display: inline-grid; justify-items: center; margin-left: 11.5px; width: 100%;">'
                    newVirtualHtml += '        <label class="form-check-label" style="width: fit-content !important;">';
                    newVirtualHtml += '            <span style="color: #555; margin-left: -11.5px;">Virtual Collection Name</span>';
                    newVirtualHtml += '        </label>';
                    newVirtualHtml += '        <input class="form-check-input saveVirtualName" style="width: 60%; margin-top: 20px;"/>';
                    newVirtualHtml += '    </div>'
                    newVirtualHtml += linespacer + linespacer;
                    newVirtualHtml += '    <div style="text-align: center;">';
                    newVirtualHtml += '        <button type="button" class="btn btn-secondary cancelVirtual">CANCEL</button>';
                    newVirtualHtml += '        <button type="button" class="btn btn-warning saveVirtual">SAVE</button>';
                    newVirtualHtml += '    </div>';
                    newVirtualHtml += '</div>'

                    return newVirtualHtml;
                },
                placement: 'top',
                title: function () {
                    let title = "Save Virtual Collection?";
                    return title;
                },
                container: '#addVirtualCollection',
                trigger: 'click'
            });

            saveVirtualCollection.on('inserted.bs.popover', function () {
                let tip = $($(this).data("bs.popover").tip);
                tip.find(".arrow").hide();
                tip.css("z-index", "999999");
                tip.css("width", "800px");
                tip.css("height", "250px");
            });

            saveVirtualCollection.on('shown.bs.popover', function () {
                $(".cancelVirtual").unbind();
                $(".cancelVirtual").click(function () {
                    saveVirtualCollection.popover("hide");
                });

                $(".saveVirtual").unbind();
                $(".saveVirtual").click(function () {
                    let newEntry = $(".saveVirtualName").val().trim();
                    that.storeVirtualCollection(idRoot, tempIdDoc, newEntry);
                    saveVirtualCollection.popover("hide");
                });
            });
        });

        $('#addDocument').unbind();
        $('#addDocument').click(function () {
            $(this).attr("title", "");

            if (addDb != null) {
                addDb.popover('toggle');
            } else {
                console.log("create");
                addDb = $('#addDocument').popover({
                    html: true,
                    sanitize: false,
                    content: function () {
                        return html;
                    },
                    title: function () {
                        let title = "Create Collection";
                        return title;
                    },
                    container: 'body',
                    trigger: 'manual'
                })
                addDb.popover('toggle');
            }
            $(this).attr("title", "Create Collection");

            addDb.off('inserted.bs.popover');
            addDb.on('inserted.bs.popover', function () {

                if (languageSelect) {
                    languageSelect.destroy();
                }

            });

            addDb.off('shown.bs.popover');
            addDb.on('shown.bs.popover', function () {

                languageSelect = new Choices("#language", {
                    itemSelectText: 'Select at least one language',
                    noChoicesText: 'No more languages to insert',
                    duplicateItemsAllowed: false,
                    removeItemButton: true
                });

                let fixSelect2Width = function (container) {
                    $("#" + container).select2({ dropdownAutoWidth: true, dropdownCssClass: "smallFont" });
                    $('[aria-labelledby="select2-' + container + '-container"]').parents(".select2-container").attr("style", "width: 80% !important");
                }

                $("#language").change(function () {

                    let semanticAnalysisSelectHtml = "";
                    let langs = $("#language").val();
                    for (let j = 0; j < langs.length; j++) {

                        if ($("#semanticAnalysisModelsMapForIndexing" + capitalize(langs[j])).hasClass("select2-hidden-accessible")) {
                            $("#semanticAnalysisModelsMapForIndexing" + capitalize(langs[j])).select2("destroy");
                        }

                        semanticAnalysisSelectHtml += '          <div style="display: flex; justify-content: space-between; align-items: center;">'

                        semanticAnalysisSelectHtml += '          <div class="labelAddDoc">' + capitalize(langs[j]) + '</div>';
                        semanticAnalysisSelectHtml += '          <select id="semanticAnalysisModelsMapForIndexing' + capitalize(langs[j]) + '" class="form-control">';

                        for (let i = 0; i < semanticAnalysisResources.length; i++) {
                            if (semanticAnalysisResources[i].language == langMap[langs[j]]) {
                                semanticAnalysisSelectHtml += "      <option value='" + semanticAnalysisResources[i].name + "'>" + semanticAnalysisResources[i].name + '</option>';
                            }
                        }

                        semanticAnalysisSelectHtml += '          </select></div>';
                    }

                    $(".semanticAnalysisSelects").html(semanticAnalysisSelectHtml);

                    for (let j = 0; j < langs.length; j++) {
                        fixSelect2Width("semanticAnalysisModelsMapForIndexing" + capitalize(langs[j]));
                    }
                });

                fixSelect2Width("semanticAnalysisModelsMapForIndexingEnglish");
                fixSelect2Width("semanticAnalysisMode");

                $(".enableQa").unbind();
                $(".enableQa").change(function () {
                    if ($(".enableQa").prop('checked')) {
                        $(".qaOption").show();
                    } else {
                        $(".qaOption").hide();
                    }
                });
                $(".enableQa").trigger("change");

                filesUpload = {};

                $("#sendFiles").unbind();
                $("#sendFiles").click(function () {
                    addDb.popover("hide");
                    that.addDocument(idRoot);
                });
                $(".cancelDelete").unbind();
                $(".cancelDelete").click(function () {
                    addDb.popover("hide");
                });
                if (dropzone != null) {
                    dropzone.destroy();
                }

                let acceptedFileOnlyPDF = 'application/pdf';

                // ACCEPT PDFs & HTML
                let acceptedFileTypes = 'application/pdf, text/html'

                // TABLES (.xls, .xlsx, .csv)
                acceptedFileTypes += ',text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

                // .txt, .doc, .docx
                acceptedFileTypes += ',text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

                // .ppt, .pptx
                acceptedFileTypes += ',application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation'

                let defaultAcceptedTypes;
                if ($(".enableFiles").prop('checked')) {
                    defaultAcceptedTypes = acceptedFileTypes;
                } else {
                    defaultAcceptedTypes = acceptedFileOnlyPDF;
                }

                dropzone = new Dropzone("#addFiles", {
                    url: "/",
                    acceptedFiles: defaultAcceptedTypes,
                    clickable: true,
                    maxFilesize: 10000,
                    uploadMultiple: true,
                    autoProcessQueue: false,
                    addRemoveLinks: true,
                    init: function () {
                        /*this.on("addedfile", function () {
                            if (this.files[1] != null) {
                                this.removeFile(this.files[0]);
                            }
                        });*/
                    },
                    accept: function (file, done) {
                        let reader = new FileReader();
                        reader.onload = function (event) {
                            filesUpload[file.upload.uuid] = {
                                name: file.name,
                                data: event.target.result.split(",")[1],
                                size: file.size
                            };
                        };
                        reader.readAsDataURL(file, "UTF-8");
                        done();
                    },
                    removedfile: function (file) {
                        delete filesUpload[file.upload.uuid];
                        file.previewElement.remove();
                    }
                });

                let tooltipContainer = $($(this).data("bs.popover").tip);

                tooltipContainer.children(".popover-body").css("overflow-y", "auto");
                tooltipContainer.find(".form-group").show();

                filesUploadJson = {};

                dropzoneJson = new Dropzone("#addFilesJson", {
                    url: "/",
                    acceptedFiles: '.json',
                    clickable: true,
                    maxFilesize: 10000,
                    uploadMultiple: true,
                    autoProcessQueue: false,
                    addRemoveLinks: true,
                    init: function () { },
                    accept: function (file, done) {
                        let reader = new FileReader();
                        reader.onload = function (event) {
                            filesUploadJson[file.upload.uuid] = {
                                name: file.name,
                                data: event.target.result.split(",")[1],
                                size: file.size
                            };
                        };
                        reader.readAsDataURL(file, "UTF-8");
                        done();
                    },
                    removedfile: function (file) {
                        delete filesUploadJson[file.upload.uuid];
                        file.previewElement.remove();
                    }
                });

                $(".enableFiles").unbind();
                $(".enableFiles").change(function () {
                    if ($(".enableFiles").prop('checked')) {
                        dropzone.destroy();
                        dropzone = new Dropzone("#addFiles", {
                            url: "/",
                            acceptedFiles: acceptedFileTypes,
                            clickable: true,
                            maxFilesize: 10000,
                            uploadMultiple: true,
                            autoProcessQueue: false,
                            addRemoveLinks: true,
                            init: function () {
                            },
                            accept: function (file, done) {
                                let reader = new FileReader();
                                reader.onload = function (event) {
                                    filesUpload[file.upload.uuid] = {
                                        name: file.name,
                                        data: event.target.result.split(",")[1],
                                        size: file.size
                                    };
                                };
                                reader.readAsDataURL(file, "UTF-8");
                                done();
                            },
                            removedfile: function (file) {
                                delete filesUpload[file.upload.uuid];
                                file.previewElement.remove();
                            }
                        });

                    } else {
                        dropzone.destroy();
                        dropzone = new Dropzone("#addFiles", {
                            url: "/",
                            acceptedFiles: acceptedFileOnlyPDF,
                            clickable: true,
                            maxFilesize: 10000,
                            uploadMultiple: true,
                            autoProcessQueue: false,
                            addRemoveLinks: true,
                            init: function () {
                            },
                            accept: function (file, done) {
                                let reader = new FileReader();
                                reader.onload = function (event) {
                                    filesUpload[file.upload.uuid] = {
                                        name: file.name,
                                        data: event.target.result.split(",")[1],
                                        size: file.size
                                    };
                                };
                                reader.readAsDataURL(file, "UTF-8");
                                done();
                            },
                            removedfile: function (file) {
                                delete filesUpload[file.upload.uuid];
                                file.previewElement.remove();
                            }
                        });
                    }
                });
            });
        });

        $('#batchIndexing').unbind();
        $('#batchIndexing').click(function () {
            $(this).attr("title", "");

            if (addDb != null) {
                addDb.popover('toggle');
            } else {
                addDb = $('#batchIndexing').popover({
                    html: true,
                    sanitize: false,
                    content: function () {
                        return html;
                    },
                    title: function () {
                        let title = "Add file";
                        return title;
                    },
                    container: 'body',
                    //placement: 'left',
                    trigger: 'manual'//,
                    //fallbackPlacement: 'clockwise'
                })
                addDb.popover('toggle');
            }
            $(this).attr("title", "Add File");

            addDb.off('inserted.bs.popover');
            addDb.on('inserted.bs.popover', function () {

                if (languageSelect) {
                    languageSelect.destroy();
                }

            });

            addDb.off('shown.bs.popover');
            addDb.on('shown.bs.popover', function () {

                languageSelect = new Choices("#language", {
                    itemSelectText: 'Select at least one language',
                    noChoicesText: 'No more languages to insert',
                    duplicateItemsAllowed: false,
                    removeItemButton: true
                });

                let fixSelect2Width = function (container) {
                    $("#" + container).select2({ dropdownAutoWidth: true, dropdownCssClass: "smallFont" });
                    $('[aria-labelledby="select2-' + container + '-container"]').parents(".select2-container").attr("style", "width: 80% !important");
                }

                $("#language").change(function () {

                    let semanticAnalysisSelectHtml = "";
                    let langs = $("#language").val();
                    for (let j = 0; j < langs.length; j++) {

                        if ($("#semanticAnalysisModelsMapForIndexing" + capitalize(langs[j])).hasClass("select2-hidden-accessible")) {
                            $("#semanticAnalysisModelsMapForIndexing" + capitalize(langs[j])).select2("destroy");
                        }

                        semanticAnalysisSelectHtml += '          <div style="display: flex; justify-content: space-between; align-items: center;">'

                        semanticAnalysisSelectHtml += '          <div class="labelAddDoc">' + capitalize(langs[j]) + '</div>';
                        semanticAnalysisSelectHtml += '          <select id="semanticAnalysisModelsMapForIndexing' + capitalize(langs[j]) + '" class="form-control">';

                        for (let i = 0; i < semanticAnalysisResources.length; i++) {
                            if (semanticAnalysisResources[i].language == langMap[langs[j]]) {
                                semanticAnalysisSelectHtml += "      <option value='" + semanticAnalysisResources[i].name + "'>" + semanticAnalysisResources[i].name + '</option>';
                            }
                        }

                        semanticAnalysisSelectHtml += '          </select></div>';
                    }

                    $(".semanticAnalysisSelects").html(semanticAnalysisSelectHtml);

                    for (let j = 0; j < langs.length; j++) {
                        fixSelect2Width("semanticAnalysisModelsMapForIndexing" + capitalize(langs[j]));
                    }
                });

                fixSelect2Width("semanticAnalysisModelsMapForIndexingEnglish");

                filesUpload = {};

                $("#sendFiles").unbind();
                $("#sendFiles").click(function () {
                    addDb.popover("hide");
                    that.addDocument(idRoot);
                });
                $(".cancelDelete").unbind();
                $(".cancelDelete").click(function () {
                    addDb.popover("hide");
                });
                if (dropzone != null) {
                    dropzone.destroy();
                }

                // TABLES (.xls, .xlsx, .csv)
                let acceptedFileTypes = 'text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

                dropzone = new Dropzone("#addFiles", {
                    url: "/",
                    acceptedFiles: acceptedFileTypes,
                    clickable: true,
                    maxFilesize: 100000,
                    uploadMultiple: false,
                    autoProcessQueue: false,
                    addRemoveLinks: true,
                    init: function () {
                    },
                    accept: function (file, done) {
                        let reader = new FileReader();
                        reader.onload = function (event) {
                            filesUpload[file.upload.uuid] = {
                                name: file.name,
                                data: event.target.result.split(",")[1],
                                size: file.size
                            };
                        };
                        reader.readAsDataURL(file, "UTF-8");
                        done();
                    },
                    removedfile: function (file) {
                        delete filesUpload[file.upload.uuid];
                        file.previewElement.remove();
                    }
                });

                let tooltipContainer = $($(this).data("bs.popover").tip);

                tooltipContainer.children(".popover-body").css("overflow-y", "auto");
                tooltipContainer.find(".form-group").show();

            });
        });
    }

    this.batchIndexingTable = function (idRoot, params) {
        let orderVector = [];
        let that = this;

        let rootFiles = $("#rootFiles");

        $(".droppable").each(function () {
            $(this).html("");
        })

        for (let key in filesUpload) {
            let value = filesUpload[key];
            console.log(value)
            orderVector.push({
                data: value.data,
                size: value.size,
                name: value.name
            });
        }

        filesUpload = {};

        if (orderVector.length > 0) {

            let file = orderVector[0].data;
            $("#batchIndexingFromTable").modal("show");
            buildDraggableFromTable(file, "#draggableContainer", "draggable", "droppable");

            $("#saveBatchIndexingFromTable").unbind();
            $("#saveBatchIndexingFromTable").click(function () {

                let data = {
                    documents: orderVector,
                    contentFields: getDragDropItems("#indexingContent", "draggable"),
                    otherMetadata: getDragDropItems("#otherMetadata", "draggable"),
                    fullTextMetadata: getDragDropItems("#fulltextMetadata", "draggable"),
                    collectionType: "structured_data",
                    idRoot: idRoot,
                    enableQa: true
                };

                data = { ...data, ...params }

                console.log(data)

                $.ajax({
                    url: global.api_url + '/steps/start',
                    type: 'POST',
                    dataType: 'json',
                    contentType: 'application/json',
                    data: JSON.stringify(data),
                    success: function (jsonResponse) {
                        console.log("Server start steps response -->", jsonResponse);
                        rootFiles.html("");
                        that.tables(idRoot);
                    }, error: function (request) {
                        rootFiles.html("");
                        that.tables(idRoot);
                        if (request.responseText) {
                            $.notify({
                                icon: "add_alert",
                                message: request.responseText
                            }, {
                                type: 'danger',
                                timer: 3000,
                                placement: {
                                    from: 'top',
                                    align: 'right'
                                }
                            });
                        }
                        console.error(request);
                    }
                });

                $("#batchIndexingFromTable").modal("hide");
            });
            $(".closeBatchIndexingFromTable").unbind();
            $(".closeBatchIndexingFromTable").click(function () {
                $("#batchIndexingFromTable").modal("hide");
            });

        } else {
            $.notify({
                icon: "add_alert",
                message: "No file has been uploaded"
            }, {
                type: 'danger',
                timer: 3000,
                z_index: 2000,
                placement: {
                    from: 'top',
                    align: 'right'
                }
            });
        }
    }

    this.initDropzoneBatchIndexing = function (idRoot) {
        let that = this;
        let html = '';
        html = '<div class="form-group" style="max-height: 65vh; padding-bottom: 0; display: none;">';
        html += '   <div class="labelAddDoc">DESCRIPTION:</div>';
        html += '   <input id="description" class="form-control" type="text" />';
        html += '   <div class="card-body table-responsive" style="display: flex; justify-content: center; margin-top: 20px; padding-top: 0; padding-bottom: 0;">';
        html += '       <form style="display: flex;width: 75%;justify-content: center;" class="dropzone" id="addFiles">';
        html += '          <div class="dz-message" data-dz-message><span>Load Indexing Table</span></div>';
        html += '       </form>';
        html += '   </div>';

        html += '   <div class="labelAddDoc" style="margin-left: -15px; margin-right: -15px;">LANGUAGE:</div>';
        html += '   <select multiple id="language" style="width: 150%;">';
        html += '     <option value="english" selected="selected">English</option>';
        //html += '     <option value="italian">Italian</option>';
        //html += '     <option value="spanish">Spanish</option>';
        html += '   </select>';

        html += '   <div></br></div>';

        html += '   <span class="qaOption">';
        html += '       <div style="margin-left: -15px;">'
        html += '           <div class="labelAddDoc">Semantic Analysis Model(s) for Indexing:</div>';
        html += '           <div class="semanticAnalysisSelects">';
        html += '               <div style="display: flex; justify-content: space-between; align-items: center;">'
        html += '                   <div class="labelAddDoc">English</div>';
        html += '                   <select id="semanticAnalysisModelsMapForIndexingEnglish" class="form-control">';

        for (let i = 0; i < semanticAnalysisResources.length; i++) {
            if (semanticAnalysisResources[i].language == langMap["english"]) {
                html += "               <option value='" + semanticAnalysisResources[i].name + "'>" + semanticAnalysisResources[i].name + '</option>';
            }
        }

        html += '                   </select>';
        html += '               </div>'
        html += '           </div>'
        html += '       </div>'

        html += '       </br></br>';
        html += '   </span>';
        html += '   </div>';
        html += '   <div style="text-align: center; padding-bottom: 20px;">';
        html += '       <button id="sendTable" type="button" class="btn btn-warning">Load</button>';
        html += '       <button id="cancelTable" type="button" class="btn btn-secondary cancelDelete">Cancel</button>';
        html += '   </div>';

        let addDb = null;

        $('#batchIndexing').unbind();
        $('#batchIndexing').click(function () {
            $(this).attr("title", "");

            if (addDb != null) {
                addDb.popover('toggle');
            } else {
                addDb = $('#batchIndexing').popover({
                    html: true,
                    sanitize: false,
                    content: function () {
                        return html;
                    },
                    title: function () {
                        let title = "Load Table for Batch Indexing";
                        return title;
                    },
                    container: 'body',
                    //placement: 'left',
                    trigger: 'manual'//,
                    //fallbackPlacement: 'clockwise'
                })
                addDb.popover('toggle');
            }
            $(this).attr("title", "Load Table for Batch Indexing");

            addDb.off('inserted.bs.popover');
            addDb.on('inserted.bs.popover', function () {

                if (languageSelect) {
                    languageSelect.destroy();
                }

            });

            addDb.off('shown.bs.popover');
            addDb.on('shown.bs.popover', function () {

                languageSelect = new Choices("#language", {
                    itemSelectText: 'Select at least one language',
                    noChoicesText: 'No more languages to insert',
                    duplicateItemsAllowed: false,
                    removeItemButton: true
                });

                $(".choices__list.choices__list--dropdown").css("z-index", 9999999);

                let fixSelect2Width = function (container) {
                    $("#" + container).select2({ dropdownAutoWidth: true, dropdownCssClass: "smallFont" });
                    $('[aria-labelledby="select2-' + container + '-container"]').parents(".select2-container").attr("style", "width: 80% !important");
                }

                $("#language").change(function () {

                    let semanticAnalysisSelectHtml = "";
                    let langs = $("#language").val();
                    for (let j = 0; j < langs.length; j++) {

                        if ($("#semanticAnalysisModelsMapForIndexing" + capitalize(langs[j])).hasClass("select2-hidden-accessible")) {
                            $("#semanticAnalysisModelsMapForIndexing" + capitalize(langs[j])).select2("destroy");
                        }

                        semanticAnalysisSelectHtml += '          <div style="display: flex; justify-content: space-between; align-items: center;">'

                        semanticAnalysisSelectHtml += '          <div class="labelAddDoc">' + capitalize(langs[j]) + '</div>';
                        semanticAnalysisSelectHtml += '          <select id="semanticAnalysisModelsMapForIndexing' + capitalize(langs[j]) + '" class="form-control">';

                        for (let i = 0; i < semanticAnalysisResources.length; i++) {
                            if (semanticAnalysisResources[i].language == langMap[langs[j]]) {
                                semanticAnalysisSelectHtml += "      <option value='" + semanticAnalysisResources[i].name + "'>" + semanticAnalysisResources[i].name + '</option>';
                            }
                        }

                        semanticAnalysisSelectHtml += '          </select></div>';
                    }

                    $(".semanticAnalysisSelects").html(semanticAnalysisSelectHtml);

                    for (let j = 0; j < langs.length; j++) {
                        fixSelect2Width("semanticAnalysisModelsMapForIndexing" + capitalize(langs[j]));
                    }
                });

                fixSelect2Width("semanticAnalysisModelsMapForIndexingEnglish");

                filesUpload = {};

                $("#sendTable").unbind();
                $("#sendTable").click(function () {

                    let languages = $("#language").val();

                    let params = {
                        languages: languages,
                        semanticAnalysisModelsMapForIndexing: that.getResourcesPerLang(languages),
                        description: $("#description").val()
                    }

                    addDb.popover("hide");
                    that.batchIndexingTable(idRoot, params);
                    //that.addDocument(idRoot);
                });
                $("#cancelTable").unbind();
                $("#cancelTable").click(function () {
                    addDb.popover("hide");
                });
                if (dropzone != null) {
                    dropzone.destroy();
                }

                // TABLES (.xls, .xlsx, .csv)
                let acceptedFileTypes = ',text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

                dropzone = new Dropzone("#addFiles", {
                    url: "/",
                    acceptedFiles: acceptedFileTypes,
                    clickable: true,
                    maxFilesize: 100000,
                    uploadMultiple: false,
                    autoProcessQueue: false,
                    addRemoveLinks: true,
                    init: function () {},
                    accept: function (file, done) {
                        let reader = new FileReader();
                        reader.onload = function (event) {
                            filesUpload[file.upload.uuid] = {
                                name: file.name,
                                data: event.target.result.split(",")[1],
                                size: file.size
                            };
                        };
                        reader.readAsDataURL(file, "UTF-8");
                        done();
                    },
                    removedfile: function (file) {
                        delete filesUpload[file.upload.uuid];
                        file.previewElement.remove();
                    }
                });

                let tooltipContainer = $($(this).data("bs.popover").tip);

                tooltipContainer.children(".popover-body").css("overflow-y", "auto");
                tooltipContainer.find(".form-group").show();

            });
        });
    }

    this.fillQuestions = function (questions, idRoot, id) {
        let that = this;

        let questionsTmp = []

        if (!questions || questions.length == 0) {
            questions = questionsTmp;
        }

        if ($("#question").autocomplete) {
            $("#question").autocomplete({
                source: questions,
                appendTo: "#questionContainer"
            });
        }

        $("#questionContainer").unbind();

        let text = "";
        text += 'Add Question <button style="top: 0px; display: inline-block;" id="addAuto" class="btn btn-white btn-round btn-just-icon">';
        text += '   <i class="material-icons">add_circle</i>';
        text += '</button>';

        for (let i = 0; i < questions.length; i++) {
            text += '<div class="card card-chart qaList"> ';
            text += '   <div class="card-body">';
            text += '     <p class="card-category">' + questions[i] + '</p>';
            text += '      <i index="' + i + '" class="fa fa-trash deleteAuto" aria-hidden="true" title="Delete Autocomplete" style="cursor: pointer; position: absolute; top: 5px; right: 6px;"></i>'

            text += '  </div>';
            text += '</div>';
        }

        $("#qautoList").html(text);

        let htmlAdd = '<div style="text-align: center;"><input type="text" id="addTextAuto"/>  <button type="button" class="btn btn-secondary cancelDelete">Cancel</button>';
        htmlAdd += '<button type="button" class="btn btn-warning addAutoModal">Add</button></div>';

        let addAuto = $('#addAuto').popover({
            html: true,
            sanitize: false,
            content: function () {
                return htmlAdd;
            },
            placement: 'left',
            title: function () {
                let title = "Add Autocomplete";
                return title;
            },
            container: '#advancedSettingGeneral',
            trigger: 'click'
        });

        addAuto.off('shown.bs.popover');
        addAuto.on('shown.bs.popover', function () {
            $(".cancelDelete").off();
            $(".cancelDelete").on("click", function () {
                addAuto.popover("hide");
            });

            $(".addAutoModal").off();
            $(".addAutoModal").on("click", function () {
                addAuto.popover("hide");
                $.ajax({
                    url: global.api_url + 'steps/' + id + '/qa/add_autocomplete',
                    type: 'POST',
                    dataType: 'json',
                    timeout: 0,
                    data: {
                        idRoot: idRoot,
                        text: $("#addTextAuto").val()
                    },
                    success: function (data) {
                        setTimeout(function () {
                            addAuto.popover("hide");
                            that.fillQuestions(data, idRoot, id);
                        }, 200);
                    },
                    error: function (request) {
                        if (request.responseText) {
                            $.notify({
                                icon: "add_alert",
                                message: request.responseText
                            }, {
                                type: 'danger',
                                timer: 3000,
                                z_index: 2000,
                                placement: {
                                    from: 'top',
                                    align: 'right'
                                }
                            });
                        }
                        console.error(request);
                    }
                });
            });
        });

        let deleteAdd = '<div class="" style="text-align: center;">';
        deleteAdd += '         <button type="button" class="btn btn-secondary cancelAutoInt">No</button>';
        deleteAdd += '         <button type="button" class="btn btn-warning deleteAutoInt">Yes</button>';
        deleteAdd += '   </div>';

        let deleteModal = $('.deleteAuto').popover({
            html: true,
            sanitize: false,
            content: function () {
                return deleteAdd;
            },
            placement: 'right',
            container: '#qautoList',
            trigger: 'click',
            template: '<div class="popover popoverVote" role="tooltip"><div class="arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>'
        }).on('click', function (e) {
            e.stopPropagation();
        });

        deleteModal.off('shown.bs.popover');
        deleteModal.on('shown.bs.popover', function () {
            let index = parseInt($(this).attr("index"));
            let el = $(this);

            $(".cancelAutoInt").off();
            $(".cancelAutoInt").on("click", function () {
                deleteModal.popover("hide");
            });
            $(".deleteAutoInt").off();
            $(".deleteAutoInt").on("click", function () {

                el.removeClass("fa-trash");
                el.addClass("fa-spinner");
                el.addClass("fa-spin");

                $.ajax({
                    url: global.api_url + '/steps/' + id + '/qa/remove_autocomplete',
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        idRoot: idRoot,
                        index: index
                    },
                    success: function (data) {
                        console.log("remove_autocomplete response -->", data);
                        setTimeout(function () {
                            that.fillQuestions(data, idRoot, id);
                        }, 200);

                    }, error: function (request) {
                        if (request.responseText) {
                            $.notify({
                                icon: "add_alert",
                                message: request.responseText
                            }, {
                                type: 'danger',
                                timer: 3000,
                                placement: {
                                    from: 'top',
                                    align: 'right'
                                }
                            });
                        }
                        console.error(request);

                        el.removeClass("fa-spinner");
                        el.removeClass("fa-spin");
                        el.addClass("fa-trash");
                    }
                });
                deleteModal.popover("hide");
            });
        });

    }

    this.configLoadOps = function (idRoot, id) {

        let that = this;
        this.getConfigList(idRoot, id);

        this.getLanguages(idRoot, id, currentConfig, function () {
            let language = packLanguages[0];
            similarity = languageParameters[language].neural.default_similarity
            that.loadEnvParams(idRoot, id, currentConfig, false, true);
        });

        this.loadQAModels(idRoot, id, currentConfig);

        this.loadDeleteConfig(idRoot, id);

    }

    this.loadDocumentsStep = function (idRoot, id, idDoc) {

        let that = this;
        $(".qATab").hide();

        $("#question").find(".select2").remove();

        this.initDefaultConfig();

        this.initExistingFilters(idRoot, id);

        this.getMetadata(idRoot, id);

        this.initBatchTest(idRoot, id);

        $.ajax({
            url: global.api_url + 'steps/' + id,
            type: 'GET',
            data: {
                idRoot: idRoot
            },
            dataType: 'json',
            success: function (jsonResponse) {

                if (jsonResponse.documents) {
                    let docs = jsonResponse.documents;
                    let qaEnabled = false
                    for (let idx in docs) {
                        if (docs[idx].enableQa) {
                            qaEnabled = true
                        }
                    }
                    if (qaEnabled) {
                        that.getDefaultConfig(idRoot, id);
                    }
                }

                console.log("Document response step -->", jsonResponse);
                $("#documents, #documentsQA, #answersList").html("");
                $("#question").val("").change();
                filesStep = {};

                if (jsonResponse.questions) {
                    that.fillQuestions(jsonResponse.questions, idRoot, id);
                } else {
                    that.fillQuestions([], idRoot, id);
                }

                let documents = jsonResponse.documents;
                $(".nameFolder").html(jsonResponse.name);
                if (documents.length > 0) {

                    window.history.replaceState(null, null, "?id=" + id + "&idRoot=" + idRoot + "&idDoc=" + ((idDoc) ? idDoc : documents[0].id));

                    let loadIframe = false;
                    for (let i = 0; i < documents.length; i++) {
                        filesStep[documents[i].id] = {
                            name: documents[i].filename,
                            position: i,
                            filename: documents[i].filename,
                            collection: documents[i].originalCollectionName
                        };
                        $("#documents, #documentsQA").append("<option style='background: white; color: black;' value='" + i + "'>" + documents[i].filename + "</option>");
                        if (idDoc && idDoc === documents[i].id) {
                            $("#documents option").last().attr("selected", "");
                            $("#documentsQA option").last().attr("selected", "");
                            $(".loader").show();
                            
                            iframe.attr("src", "./pdf2html/" + documents[i].url);
                            loadIframe = true;
                        }
                    }

                    if (!loadIframe) {
                        $(".loader").show();
                        iframe.attr("src",  "./pdf2html/" + documents[0].url);
                    }

                    $("#documents").off("change");
                    $("#documents").on("change", function (e) {
                        $(".loaderPdf").show();
                        iframeReady = false;
                        let tmp = documents[parseInt($("#documents").val())];
                        iframe.attr("src",  "./pdf2html/" +  tmp.url);
                        window.history.replaceState(null, null, "?id=" + id + "&idRoot=" + idRoot + "&idDoc=" + tmp.id);

                    });

                    $("#documentsQA").off("change");
                    $("#documentsQA").on("change", function (e) {
                        $(".loaderPdf").show();
                        iframeReady = false;
                        let tmp = documents[parseInt($("#documentsQA").val())];
                        $(".loader").show();
                        iframe.attr("src", "./pdf2html/"  +  tmp.url);
                        window.history.replaceState(null, null, "?id=" + id + "&idRoot=" + idRoot + "&idDoc=" + tmp.id);

                    });

                    if (documents[0].enableQa) {
                        that.loadQA(idRoot, id);
                    }

                } else {
                    iframe.attr("src", "");
                }
            }, error: function (request) {
                if (request.responseText) {
                    $.notify({
                        icon: "add_alert",
                        message: request.responseText
                    }, {
                        type: 'danger',
                        timer: 3000,
                        placement: {
                            from: 'top',
                            align: 'right'
                        }
                    });
                }
                console.error(request);
            }
        });
    }

    this.fillVirtualCreationTable = function (infoSteps) {

        tempIdDoc = crypto.randomUUID();

        let html = "<table border='0' class='detailsDocs' style='width: 100%; text-align: center; margin: 0 auto;'>";

        html += "<thead class='text-warning'>";
        html += "   <tr style='text-align: center;'>";
        html += "      <th style='text-align: left; padding: 10px 18px; width: 300px !important;'>Collection</th>";
        html += "      <th style='padding: 10px 18px; width: 50px !important;'>Action</th>";
        html += "    </tr>";
        html += "</thead>";
        html += "<tbody class='evenOddTable'>";

        let counter = 0;

        for (let idx in infoSteps) {
            let obj = infoSteps[idx];
            if (!obj.multiIndex) {

                let includedCheck = ""
                includedCheck += '<label class="form-check-label" style="width: auto !important; display: inline-table; margin-left: 40px; position: relative; transform:scale(1.3);">';
                includedCheck += '  <span class="form-check-sign">';
                includedCheck += '      <span class="check"></span>';
                includedCheck += '  </span>';
                includedCheck += '  <input class="form-check-input enableCollection" style="accent-color: purple; margin-top: -7px;" type="checkbox">';
                includedCheck += '</label>';

                html += "<tr role='row' id-column='" + tempIdDoc + "' style='text-align: center;' id-doc='" + idx + "' id-index='" + counter + "'><td style='padding: 20px; text-align: left;'>" + obj.description + "</td>";
                html += "<td style='padding: 10px;'>" + includedCheck + "</td></tr>";

                counter += 1;
            }
        }

        html += "</tbody>";
        html += "</table>";

        tableForVirtualCollection = html;

    }

    this.getLanguages = function (idRoot, id, currentConfig, callback = null) {

        let that = this;

        $.ajax({
            url: global.api_url + 'steps/' + id + "/qa/get_languages",
            type: 'GET',
            dataType: 'json',
            data: {
                idRoot: idRoot,
                qaConfigName: currentConfig
            },
            success: function (jsonResponse) {

                if (jsonResponse.success === true) {

                    packLanguages = jsonResponse.languages
                    languageParameters = jsonResponse.parameters

                    that.updateLangSettings(packLanguages);

                } else {
                    packLanguages = defaultPackLanguages;

                    if (jsonResponse.error) {
                        $.notify({
                            icon: "add_alert",
                            message: jsonResponse.error
                        }, {
                            type: 'danger',
                            timer: 3000,
                            placement: {
                                from: 'top',
                                align: 'right'
                            }
                        });
                    }
                }

                that.languageFilter();

                if (callback != null) {
                    callback();
                }

            },
            error: function (request) {
                if (request.responseText) {
                    packLanguages = defaultPackLanguages;
                    $.notify({
                        icon: "add_alert",
                        message: request.responseText
                    }, {
                        type: 'danger',
                        timer: 3000,
                        placement: {
                            from: 'top',
                            align: 'right'
                        }
                    });
                }
                console.error(request);
            }
        });
    }

    this.getDefaultConfig = function (idRoot, id) {

        let that = this;

        $.ajax({
            url: global.api_url + 'steps/' + id + "/qa/get_default_config",
            type: 'GET',
            dataType: 'json',
            data: {
                idRoot: idRoot
            },
            success: function (jsonResponse) {
                if (jsonResponse.success === true && jsonResponse.config) {

                    currentConfig = jsonResponse.config;

                } else {

                    if (jsonResponse.error) {
                        $.notify({
                            icon: "add_alert",
                            message: jsonResponse.error
                        }, {
                            type: 'danger',
                            timer: 3000,
                            placement: {
                                from: 'top',
                                align: 'right'
                            }
                        });
                    }
                }

                that.configLoadOps(idRoot, id);
            },
            error: function (request) {

                that.configLoadOps(idRoot, id);

                if (request.responseText) {
                    $.notify({
                        icon: "add_alert",
                        message: request.responseText
                    }, {
                        type: 'danger',
                        timer: 3000,
                        placement: {
                            from: 'top',
                            align: 'right'
                        }
                    });
                }
                console.error(request);
            }
        });
    }

    this.getConfigList = function (idRoot, id) {

        let that = this;

        $.ajax({
            url: global.api_url + 'steps/' + id + "/qa/get_config_list",
            type: 'GET',
            dataType: 'json',
            data: {
                idRoot: idRoot
            },
            success: function (jsonResponse) {

                if (jsonResponse.success === true) {

                    configList = [defaultConfigName]

                    for (let i = 0; i < jsonResponse.configs.length; i++) {
                        if (jsonResponse.configs[i] != defaultConfigName) {
                            configList.push(jsonResponse.configs[i])
                        }
                    }

                    that.loadDeleteConfig(idRoot, id)

                } else {

                    if (jsonResponse.error) {
                        $.notify({
                            icon: "add_alert",
                            message: jsonResponse.error
                        }, {
                            type: 'danger',
                            timer: 3000,
                            placement: {
                                from: 'top',
                                align: 'right'
                            }
                        });
                    }
                }
            },
            error: function (request) {
                if (request.responseText) {
                    $.notify({
                        icon: "add_alert",
                        message: request.responseText
                    }, {
                        type: 'danger',
                        timer: 3000,
                        placement: {
                            from: 'top',
                            align: 'right'
                        }
                    });
                }
                console.error(request);
            }
        });
    }

    this.loadQAModels = function (idRoot, id, currentConfig) {

        $.ajax({
            url: global.api_url + 'steps/' + id + "/qa/load_models",
            type: 'POST',
            dataType: 'json',
            data: {
                idRoot: idRoot,
                qaConfigName: currentConfig
            }
        });
    }

    this.generateConfigSelect = function (configList) {
        let selectData = "";
        for (let i = 0; i < configList.length; i++) {
            if (configList[i] == currentConfig) {
                selectData += '          <option selected="selected" value="' + configList[i] + '">' + configList[i] + ' </option>';
            } else {
                selectData += '          <option value="' + configList[i] + '">' + configList[i] + ' </option>';
            }
        }

        return selectData
    }

    this.updateLangSettings = function (packLanguages) {

        if ($(".langSettings").length > 0) {

            let groups = ["elastic", "neural"];
            let currLang = $(".langSettings").val();

            for (let j = 0; j < packLanguages.length; j++) {

                let language = packLanguages[j];
                $(".langSettings").val(language);
                $(".langSettings").trigger("change");

                for (let i = 0; i < groups.length; i++) {
                    let group = groups[i];

                    let groupDiv = $(".scoreParams[group='" + group + "']");

                    let scoreParameters;
                    if (group == "neural") {
                        let similarityVal = $(".similarity").val();
                        scoreParameters = languageParameters[language][group].normalization_params[similarityVal];
                    } else {
                        scoreParameters = languageParameters[language][group].normalization_params.symbolic;
                    }

                    groupDiv.find(".range1min").val(scoreParameters.min_score[0]).trigger("change");
                    groupDiv.find(".range1max").val(scoreParameters.max_score[0]).trigger("change");
                    groupDiv.find(".lambda").val(scoreParameters.lambda).trigger("change");

                    if (group == "elastic") {
                        groupDiv.find(".range2min").val(scoreParameters.min_score[1]).trigger("change");
                        groupDiv.find(".range2max").val(scoreParameters.max_score[1]).trigger("change");
                    }

                    if (group == "neural") {
                        groupDiv.find(".similarity").val(languageParameters[language][group].default_similarity).trigger("change");
                    }
                }

                if (languageParameters[language].cross_encoder) {

                    $(".crossEncoderParams .model").val(languageParameters[language].cross_encoder.model).trigger("change");
                    if (languageParameters[language].cross_encoder.evaluated_content) {
                        $(".langCeEvalData").val(languageParameters[language].cross_encoder.evaluated_content).trigger("change");
                    } else {
                        $(".langCeEvalData").val(crossEncoderContentTypes[0]).trigger("change");
                    }
                }
            }

            $(".langSettings").val(currLang);
            $(".langSettings").trigger("change");
            $(".langCeSettings").val(currLang).trigger("change");

        }
    }

    this.fillCheckBox = function (container, data) {
        if (data === true) {
            $(container).attr('checked', true);
            $(container)[0].checked = true;
        } else {
            $(container).attr('checked', false);
            $(container)[0].checked = false;
        }
    }

    this.setEnvParamsConfig = function (envParams) {

        getDebug = envParams.params.getDebug;

        modes = envParams.params.modes;
        filters = envParams.params.filters;
        top_k_docs = envParams.params.top_k_docs;

        group_sub_passages = envParams.params.group_sub_passages;
        if (group_sub_passages !== false) {
            group_sub_passages = true
        }

        if (envParams.ui) {
            metadata_template_to_title = envParams.ui.metadata_template_to_title;
            if (metadata_template_to_title == undefined || metadata_template_to_title == null) {
                metadata_template_to_title = default_metadata_template_to_title;
            }
        }

        vote_query = envParams.params.vote_query;

        enable_filter_button = envParams.params.enable_filter_button;
        if (enable_filter_button) {
            $("#filterQa").show()
        } else {
            $("#filterQa").hide();
        }

        similarity = envParams.neural.similarity;

        getExpandQuery = envParams.elastic.getExpandQuery;
        entity_boost = envParams.elastic.entity_boost;
        expansion_boost = envParams.elastic.expansion_boost;
        getCustomElasticRanges = envParams.elastic.getCustomElasticRanges;

        getStatistics = envParams.params.getStatistics;

    }

    this.setEnvParams = function (envParams, init = false) {

        this.setEnvParamsConfig(envParams)

        if (init === false) {

            this.fillCheckBox(".getExpandQuery", getExpandQuery);
            this.fillCheckBox(".getDebug", getDebug);

            this.fillCheckBox(".getStatistics", getStatistics);

            this.fillCheckBox(".getCustomElasticRanges", getCustomElasticRanges);
            this.fillCheckBox(".group_sub_passages", group_sub_passages);
            this.fillCheckBox(".enable_filter_button", enable_filter_button);
            this.fillCheckBox(".vote_query", vote_query);

            $(".getCustomElasticRanges").trigger("change");

            $(".entity_boost").val(entity_boost);
            $(".expansion_boost").val(expansion_boost);

            $(".similarity").val(similarity).trigger('change');

            $(".modesList").val(modes).trigger('change');
            $(".filtersList").val(filters).trigger('change');

            $(".top_k_docs").val(top_k_docs);

            this.metadataTemplateToTitle();

        }
    }

    this.storeEnvParams = function () {
        return {
            params: {
                getDebug: getDebug,
                getStatistics: getStatistics,
                modes: modes,
                filters: filters,
                top_k_docs: top_k_docs,
                group_sub_passages: group_sub_passages,
                vote_query: vote_query,
                enable_filter_button: enable_filter_button
            },
            neural: {
                similarity: similarity
            },
            elastic: {
                getExpandQuery: getExpandQuery,
                entity_boost: entity_boost,
                expansion_boost: expansion_boost,
                getCustomElasticRanges: getCustomElasticRanges
            }, ui: {
                metadata_template_to_title: metadata_template_to_title
            }
        }
    }

    this.loadConfiguration = function (idRoot, id, prevConfig, forcedStoredConfig = undefined) {

        let that = this;

        if (forcedStoredConfig) {
            forcedStoredConfig()
        } else {
            if (prevConfig) {
                storedConfigs[prevConfig] = JSON.parse(JSON.stringify({
                    languageParameters: languageParameters,
                    packLanguages: packLanguages,
                    envParams: that.storeEnvParams()
                }));
            }
        }

        if (storedConfigs[currentConfig] && currentConfig != prevConfig) {

            languageParameters = storedConfigs[currentConfig].languageParameters;

            that.updateGenSettings();
            that.updateLangSettings(storedConfigs[currentConfig].packLanguages);
            that.setEnvParams(storedConfigs[currentConfig].envParams);

            delete storedConfigs[currentConfig];
        } else if (storedConfigs[currentConfig] && currentConfig == prevConfig) {
            delete storedConfigs[currentConfig];
        } else {

            that.loadEnvParams(idRoot, id, currentConfig, true)
            that.getLanguages(idRoot, id, currentConfig);

        }

        that.loadQAModels(idRoot, id, currentConfig);

    }

    this.loadEnvParams = function (idRoot, id, currentConfig, load = false, init = false) {

        let that = this;

        if (load === true) {
            $(".popoverContainer").hide();
            $(".popoverContainer").parent().prepend('<div class="loadEnvParams">' + loadingHTML + "</div>");
        }

        $.ajax({
            url: global.api_url + 'steps/' + id + "/qa/get_env_params",
            type: 'GET',
            dataType: 'json',
            data: {
                idRoot: idRoot,
                qaConfigName: currentConfig
            },
            success: function (jsonResponse) {

                if (jsonResponse.envParams) {
                    that.setEnvParams(jsonResponse.envParams, init);
                } else {
                    that.persistConfig(idRoot, id, defaultConfigName)
                }

                if (load === true) {
                    $(".popoverContainer").show();
                    $(".loadEnvParams").remove();
                }

            }, error: function (request) {
                if (load === true) {
                    $(".popoverContainer").show();
                    $(".loadEnvParams").remove();
                }
                if (request.responseText) {
                    $.notify({
                        icon: "add_alert",
                        message: request.responseText
                    }, {
                        type: 'danger',
                        timer: 3000,
                        placement: {
                            from: 'top',
                            align: 'right'
                        }
                    });
                }
                console.error(request);
            }
        });
    }

    this.generateHybridSelect = function (variable, ranking = false) {
        let foundElastic = false;
        let foundNeural = false;
        let foundHybrid = false;
        let foundCross = false;

        let selectData = "";

        if (variable == "elastic") {
            foundElastic = true;
        } else if (variable == "neural") {
            foundNeural = true;
        } else if (variable == "hybrid") {
            foundHybrid = true;
        } else if (variable == "cross-encoder") {
            foundCross = true;
        }

        if (foundHybrid) {
            selectData += '          <option selected="selected" value="hybrid">Hybrid</option>';
        } else {
            selectData += '          <option value="hybrid">Hybrid</option>';
        }

        if (foundElastic) {
            selectData += '          <option selected="selected" value="elastic">Symbolic</option>';
        } else {
            selectData += '          <option value="elastic">Symbolic</option>';
        }

        if (foundNeural) {
            selectData += '          <option selected="selected" value="neural">Neural</option>';
        } else {
            selectData += '          <option value="neural">Neural</option>';
        }

        if (ranking) {
            if (foundCross) {
                selectData += '          <option selected="selected" value="cross-encoder">Cross-Encoder</option>';
            } else {
                selectData += '          <option value="cross-encoder">Cross-Encoder</option>';
            }
        }

        return selectData
    }


    this.crossEncoderSelection = function () {

        let htmlOpt = ""
        tempLanguageParameters = deepCopy(languageParameters)

        if (languageParameters) {

            htmlOpt += '<div class="crossEncoderParams">';

            htmlOpt += '             <label class="form-check-label" style="display: flex; float: left; width: fit-content !important;">';
            htmlOpt += '             <span style="color: #555; margin-right: 43px;">Evaluated Data</span>';
            htmlOpt += '             </label>';
            htmlOpt += '             <select class="langCeEvalData">';

            for (let i = 0; i < crossEncoderContentTypes.length; i++) {
                if (crossEncoderContentTypes[i] == crossEncoderContent) {
                    htmlOpt += '                <option selected="selected">' + crossEncoderContentTypes[i] + '</option>';
                } else {
                    htmlOpt += '                <option>' + crossEncoderContentTypes[i] + '</option>';
                }
            }

            htmlOpt += '             </select>';
            htmlOpt += linespacer + linespacer;

            htmlOpt += '             <label class="form-check-label" style="display: flex; float: left; width: fit-content !important;">';
            htmlOpt += '             <span style="color: #555; margin-right: 76px;">Language</span>';
            htmlOpt += '             </label>';
            htmlOpt += '             <select class="langCeSettings">';

            for (let i = 0; i < packLanguages.length; i++) {
                if (i == 0) {
                    htmlOpt += '                <option selected="selected">' + packLanguages[i] + '</option>';
                } else {
                    htmlOpt += '                <option>' + packLanguages[i] + '</option>';
                }
            }

            htmlOpt += '             </select>';

            let langCeConfig = languageParameters[packLanguages[0]]["cross_encoder"];
            htmlOpt += linespacer;

            htmlOpt += '         <label class="form-check-label" style="margin-right:97px; width: fit-content !important;">';
            htmlOpt += '            <span style="color: #555;">Model</span>';
            htmlOpt += '         </label>';
            htmlOpt += '         <select class="model" style="margin-left: 4px; margin-top: 2px;">';

            for (let i in crossEncoderModels) {
                if (crossEncoderModels[i] == langCeConfig.model) {
                    htmlOpt += '        <option selected="selected" value="' + langCeConfig.model + '">' + langCeConfig.model + '</option>';
                } else {
                    htmlOpt += '        <option value="' + crossEncoderModels[i] + '">' + crossEncoderModels[i] + '</option>';
                }
            }

            htmlOpt += '         </select>';
            htmlOpt += linespacer;

            htmlOpt += '</div>';
        }

        return htmlOpt
    }

    this.addScoreParams = function (parametersGroup) {

        let htmlOpt = ""
        tempLanguageParameters = deepCopy(languageParameters)

        if (languageParameters) {

            htmlOpt += '<div class="scoreParams" group="' + parametersGroup + '">';

            if (parametersGroup != "neural") {
                // split line
                htmlOpt += linespacer;
                htmlOpt += '<div style = "border-bottom: 1px solid black;></br></div>';
                htmlOpt += linespacer + linespacer;
            }
            // score settings - lang select

            htmlOpt += '             <label class="form-check-label" style="display: flex; float: left; width: fit-content !important;">';
            htmlOpt += '             <span style="color: #555; margin-right: 77px;">Score Settings</span>';
            htmlOpt += '             </label>';
            htmlOpt += '             <select class="langSettings">';

            let langSelect = "";
            for (let i = 0; i < packLanguages.length; i++) {
                if (i == 0) {
                    langSelect += '                <option selected="selected">' + packLanguages[i] + '</option>';
                } else {
                    langSelect += '                <option>' + packLanguages[i] + '</option>';
                }
            }

            let selectedParameters = languageParameters[packLanguages[0]][parametersGroup];

            let defaultScores;
            if (parametersGroup == "neural") {
                defaultScores = selectedParameters.normalization_params[selectedParameters.default_similarity];
            } else if (parametersGroup == "elastic") {
                defaultScores = selectedParameters.normalization_params.symbolic;
            }

            htmlOpt += langSelect
            htmlOpt += '             </select>';
            htmlOpt += linespacer;

            if (parametersGroup == "neural") {
                // similarity
                htmlOpt += '         <label class="form-check-label" style="margin-right:108px; width: fit-content !important;">';
                htmlOpt += '            <span style="color: #555;">Similarity</span>';
                htmlOpt += '         </label>';
                htmlOpt += '         <select class="similarity" style="margin-left: 4px; margin-top: 2px;">';
                if (selectedParameters.default_similarity == "cosine") {
                    htmlOpt += '        <option selected="selected" value="cosine">cosine</option>';
                    htmlOpt += '        <option value="dot_product">dot_product</option>';
                } else {
                    htmlOpt += '        <option value="cosine">cosine</option>';
                    htmlOpt += '        <option selected="selected" value="dot_product">dot_product</option>';
                }
                htmlOpt += '         </select>';
            }

            htmlOpt += linespacer;

            // score settings - range1

            if (parametersGroup == "neural") {
                htmlOpt += '             <label class="neuralRangeHide form-check-label" style="margin-top: 8px; margin-right: 90px; width: fit-content !important;">';
            } else {
                htmlOpt += '             <label class="form-check-label" style="margin-top: 8px; margin-right: 90px; width: fit-content !important;">';
            }

            htmlOpt += '                <span style="color: #555;">Range #1</span>';

            htmlOpt += '             </label>';

            if (parametersGroup == "neural") {
                htmlOpt += '             <div class="neuralRangeHide" style="display: flex; float: right;">';
            } else {
                htmlOpt += '             <div style="display: flex; float: right;">';
            }

            htmlOpt += '               <input class="range1min" value="' + defaultScores.min_score[0] + '" type="number" min=0 style="margin-top: 0.3em; margin-left: 2px; margin-right: 2px; width: 70px; position: relative !important"/>';
            htmlOpt += '               <input class="range1max" value="' + defaultScores.max_score[0] + '" type="number" min=0 style="margin-top: 0.3em; margin-left: 3px; margin-right: 2px; width: 70px; position: relative !important"/>';
            htmlOpt += '             </div> </br>';

            if (parametersGroup == "neural") {

                htmlOpt += linespacer;
                htmlOpt += '             <label class="form-check-label" style="margin-top: 7px; margin-right: 78px; width: fit-content !important;">';
                htmlOpt += '             <span style="color: #555;">Weight of neural ranking</span>';
                htmlOpt += '             </label>';
                htmlOpt += '             <div style="display: flex; float: right;">';
                htmlOpt += '                <input class="lambda" value="' + defaultScores.lambda + '" type="number" min=0 max=1 step=".1" style="margin-top: 0.3em; margin-left: 2px; margin-right: 2px; width: 70px; position: relative !important"/>';
                htmlOpt += '             </div>';
            }

            if (parametersGroup == "elastic") {

                // score settings - range2
                htmlOpt += '             <label class="form-check-label" style="margin-top: 7px; margin-right: 90px; width: fit-content !important; float: inline-start;">';
                htmlOpt += '             <span style="color: #555;">Range #2</span>';
                htmlOpt += '             </label>';
                htmlOpt += '             <div style="display: flex; float: right;">';
                htmlOpt += '                <input class="range2min" value="' + defaultScores.min_score[1] + '" type="number" min=0 style="margin-top: 0.3em; margin-left: 2px; margin-right: 2px; width: 70px; position: relative !important"/>';
                htmlOpt += '                <input class="range2max" value="' + defaultScores.max_score[1] + '" type="number" min=0 style="margin-top: 0.3em; margin-left: 3px; margin-right: 2px; width: 70px; position: relative !important"/>';
                htmlOpt += '             </div>';

                // score settings - lambda
                htmlOpt += '             <label class="form-check-label" style="margin-top: 7px; margin-right: 179px; width: fit-content !important;">';
                htmlOpt += '             <span style="color: #555;">Lambda</span>';
                htmlOpt += '             </label>';
                htmlOpt += '             <div style="display: flex; float: right;">';
                htmlOpt += '                <input class="lambda" value="' + defaultScores.lambda + '" type="number" min=0 max=1 step=".1" style="margin-top: 0.3em; margin-left: 2px; margin-right: 2px; width: 70px; position: relative !important"/>';
                htmlOpt += '             </div>';
                htmlOpt += linespacer + linespacer;
            }
            htmlOpt += '        </div>';
        }

        return htmlOpt
    }

    this.showQaResults = function (jsonResponse, id) {

        $(".btnContainer").show();
        //$("#loadQa").hide();
        //console.log("QA response -->", jsonResponse);

        let that = this;
        let generatedMode = false;
        let objs = [];
        if (jsonResponse.success === true) {
            $('.popover').remove();
            $("#answersList").html('<div id="metadata" style="max-height: 200px; overflow: auto;"></div>');
            //tags
            let data = [];
            let index = -1;
            if (jsonResponse.result.statistics && selectedMetadata.length > 0) {

                if (oldQuery == "" || oldQuery != jsonResponse.result.query) {
                    oldQuery = jsonResponse.result.query;
                }

                $("#metadata").html("");
                let html = "";

                for (let all in jsonResponse.result.statistics) {
                    for (let meta in jsonResponse.result.statistics[all]) {

                        let found = false;
                        let key = this.getMetadataKey(meta);
                        let label = this.getMetadataLabel(meta);

                        let tmpArr = [];
                        for (let into in jsonResponse.result.statistics[all][meta]) {
                            jsonResponse.result.statistics[all][meta][into].label = into;

                            jsonResponse.result.statistics[all][meta][into].parent = key;
                            tmpArr.push(jsonResponse.result.statistics[all][meta][into]);
                        }

                        tmpArr.sort(function (a, b) {
                            return (b.score_frequency - a.score_frequency)
                        });

                        data.push(tmpArr);
                        index++;

                        for (let i = 0; i < selectedMetadata.length; i++) {
                            if (label == selectedMetadata[i]) {
                                found = true;
                                break;
                            }
                        }

                        if (found) {
                            html += '  <div class="chip" style="padding: 10px;" index="' + index + '">';
                            html += '     <div class="chip-head">' + label[0] + '</div>';
                            html += '     <div class="chip-content">' + label + '</div>';
                            html += '     <div class="chip-selecetd count_' + key + '">0</div>';
                            html += ' </div>';
                        }
                    }
                }

                $("#metadata").html(html);

                for (let i = 0; i < selectedMetadata.length; i++) {
                    let tmpKey = selectedMetadata[i];
                    let param = that.getMetadataInfoFromLabel(tmpKey);

                    let len = 0;
                    if (tmpElasticFilters[tmpKey]) {
                        let tmpOut = JSON.parse(tmpElasticFilters[tmpKey]);

                        //let arrInt;
                        if (param.search_types[0] == "terms") {
                            len = tmpOut[0].terms[param.field + ".keyword"].length;
                        } else {
                            len = tmpOut[0].query_string.query.split("OR").length;
                        }
                    }

                    if (len == 0) {
                        $(".count_" + param.key).hide();
                    } else {
                        $(".count_" + param.key).show();
                    }

                    $(".count_" + param.key).html(len);
                }

                let ref = ".chip";

                let editFilter = $(ref).popover({
                    html: true,
                    sanitize: false,
                    content: function () {

                        let tmp = data[parseInt($(this).attr("index"))];

                        let html = "";
                        html += '   <div class="card-body table-responsive" style="height:200px; overflow:auto;">';
                        html += '   <table class="table table-hover chipTable">';
                        html += '     <thead class="text-warning">';
                        html += '       <tr>';
                        html += '         <th>Value</th>';
                        html += '         <th>Score</th>';
                        html += '       </tr>';
                        html += '     </thead>';
                        html += '     <tbody>';

                        for (let i = 0; i < tmp.length; i++) {
                            let found = false;
                            let tmpKey = tmp[i].parent;

                            if (tmpElasticFilters[tmp[i].parent]) {

                                let param = that.getMetadataInfo(tmpKey);
                                let tmpOut = JSON.parse(tmpElasticFilters[tmp[i].parent]);
                                let arrInt;
                                if (param.search_types[0] == "terms") {
                                    arrInt = tmpOut[0].terms[param.field + ".keyword"];
                                } else {
                                    arrInt = tmpOut[0].query_string.query.split(" OR ");
                                }

                                for (let k = 0; k < arrInt.length; k++) {
                                    if (tmp[i].label == arrInt[k].replace(/"/g, "")) {
                                        found = true;
                                        break;
                                    }
                                }
                            }

                            if (found) {
                                html += '       <tr class="selectMeta selected" style="cursor: pointer;" index="' + $(this).attr("index") + '" index-int="' + i + '">';
                            } else {
                                html += '       <tr class="selectMeta" style="cursor: pointer;" index="' + $(this).attr("index") + '" index-int="' + i + '">';
                            }

                            html += '<td>' + tmp[i].label + '</td>';

                            html += ' <td><div class="progress" style="width: 100px; display: inline-flex; background-color: white">';
                            html += ' <div class="progress-bar" role="progressbar" style="width: ' + (tmp[i].score_frequency * 100) + '%;" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>';
                            html += ' </div></td>';

                            html += '       </tr>';
                        }

                        html += '     </tbody>';
                        html += '   </table>';
                        html += '   </div>';

                        return html;
                    },
                    //placement: 'right',
                    title: function () {
                        let title = '<div style="margin: -15px -15px -5px!important; padding: 15px !important; background: #e7e7e7">Values  <span class="material-icons closeMeta" style="color: #000; position: absolute; right: 13px; cursor: pointer;" title="Close">close</span></div>';
                        return title;
                    },
                    container: 'body',
                    trigger: 'click'
                }).click(function (e) {
                    $(ref).not(this).popover('hide');
                });

                editFilter.off('show.bs.popover');
                editFilter.on('show.bs.popover', function () {

                    filter_id = $(ref).attr("filter_id");

                    $($(this).data("bs.popover").tip).addClass("custom-popover-scale-center editFilter");
                    
                });

                editFilter.off('inserted.bs.popover');
                editFilter.on('inserted.bs.popover', function () {

                });

                editFilter.off('shown.bs.popover');
                editFilter.on('shown.bs.popover', function () {

                    $(".closeMeta").unbind();
                    $(".closeMeta").click(function () {
                        editFilter.popover('hide');
                    });

                    $(".selectMeta").unbind();
                    $(".selectMeta").click(function () {

                        let tmpIndex = $(this).attr("index");
                        let tmpIndexInt = $(this).attr("index-int");
                        let tmp = data[tmpIndex];
                        let tmpValue = tmp[tmpIndexInt];

                        let key = tmpValue.parent;

                        let param = that.getMetadataInfo(key);

                        if ($(this).hasClass("selected")) {

                            let index = -1;
                            if (tmpElasticFilters[key]) {
                                let tmp = JSON.parse(tmpElasticFilters[key]);
                                let arr;
                                if (param.search_types[0] == "terms") {
                                    arr = tmp[0].terms[param.field + ".keyword"];
                                } else {
                                    arr = tmp[0].query_string.query.split(" OR ");
                                }

                                for (let i = 0; i < arr.length; i++) {
                                    if (arr[i].replace(/"/g, "") == tmpValue.label) {
                                        index = i;
                                        break;
                                    }
                                }

                                if (index == -1) {
                                    $(this).addClass("selected");
                                    if (param.search_types[0] == "terms") {
                                        arr.push(tmpValue.label);
                                    } else {
                                        tmp[0].query_string.query = tmp[0].query_string.query + " OR " + '"' + tmpValue.label + '"';
                                    }
                                    tmpElasticFilters[key] = JSON.stringify(tmp);
                                } else {
                                    $(this).removeClass("selected");
                                    if (arr.length == 1) {
                                        delete tmpElasticFilters[key];
                                    } else {
                                        arr.splice(index, 1);
                                        if (param.search_types[0] != "terms") {
                                            tmp[0].query_string.query = "";
                                            for (let k = 0; k < arr.length; k++) {
                                                if (tmp[0].query_string.query == "") {
                                                    tmp[0].query_string.query = arr[k];
                                                } else {
                                                    tmp[0].query_string.query = tmp[0].query_string.query + + " OR " + arr[k];
                                                }
                                            }
                                        }

                                        tmpElasticFilters[key] = JSON.stringify(tmp);
                                    }

                                }
                            } else {
                                let tmp = [];
                                if (param.search_types[0] == "terms") {
                                    tmp.push({
                                        "terms": {
                                            [tmpKey + ".keyword"]: [tmpValue.label]
                                        }
                                    });
                                    arr = tmp[0].terms[param.field + ".keyword"];
                                } else {
                                    tmp.push({
                                        "query_string": {
                                            "fields": [param.field]
                                        },
                                        "query": '"' + tmpValue.label + '"'
                                    });
                                }

                                tmpElasticFilters[key] = JSON.stringify(tmp);
                                tmpActiveElasticFilters.push(key);
                            }
                        } else {
                            $(this).addClass("selected");

                            let tmpKey = tmpValue.parent;

                            if (tmpElasticFilters[tmpKey]) {
                                let tmp = JSON.parse(tmpElasticFilters[tmpKey]);

                                if (param.search_types[0] == "terms") {
                                    let arr = [];
                                    arr = tmp[0].terms[param.field + ".keyword"];
                                    arr.push(tmpValue.label);
                                } else {
                                    tmp[0].query_string.query = tmp[0].query_string.query + " OR " + '"' + tmpValue.label + '"';
                                }

                                tmpElasticFilters[key] = JSON.stringify(tmp);
                            } else {
                                let tmp = [];
                                if (param.search_types[0] == "terms") {
                                    tmp.push({
                                        "terms": {
                                            [param.field + ".keyword"]: [tmpValue.label]
                                        }
                                    });
                                } else {
                                    tmp.push({
                                        "query_string": {
                                            "fields": [param.field],
                                            "query": '"' + tmpValue.label + '"'
                                        }
                                    });
                                }

                                tmpElasticFilters[key] = JSON.stringify(tmp);
                                tmpActiveElasticFilters.push(key);
                            }

                        }

                        let len = 0;
                        if (tmpElasticFilters[key]) {

                            let tmp = JSON.parse(tmpElasticFilters[key]);
                            let param = that.getMetadataInfo(key);

                            if (param.search_types[0] == "terms") {
                                len = tmp[0].terms[param.field + ".keyword"].length;
                            } else {
                                len = tmp[0].query_string.query.split(" OR ").length;
                            }
                        }

                        if (len == 0) {
                            $(".count_" + key).hide();
                        } else {
                            $(".count_" + key).show();
                        }

                        $(".count_" + key).html(len);

                        activeElasticFilters = deepCopy(tmpActiveElasticFilters);
                        elasticFilters = deepCopy(tmpElasticFilters);

                    });

                });

            }

            objs = jsonResponse.result.documents;
            latestResponse = jsonResponse.result;

            let text = "";

            for (let i = 0; i < objs.length; i++) {
                let obj = objs[i];

                if (obj.not_aligned) {
                    text += '<div class="card card-chart qaList not-aligned" id-vet="' + i + '">';
                } else {
                    text += '<div class="card card-chart qaList viewQa" id-vet="' + i + '">';
                }
                text += '     <div class="card-header card-header-success">';

                let tmpNome = "";

                let tmp = metadata_template_to_title;
                for (let i = 0; i < tmp.length; i++) {
                    if (tmp[i] == "filename") {
                        if (tmpNome != "") {
                            tmpNome += " - ";
                        }

                        tmpNome += filesStep[obj.filename].filename;
                    } else if (tmp[i] == "collection") {

                        if (tmpNome != "") {
                            tmpNome += " - ";
                        }

                        if (filesStep[obj.filename].collection) {
                            tmpNome += filesStep[obj.filename].collection;
                        }

                    } else if (tmp[i] == "last_title") {
                        if (obj.last_title) {
                            if (tmpNome != "") {
                                tmpNome += " - ";
                            }

                            tmpNome += obj.last_title;
                        }
                    } else if (tmp[i] == "title") {
                        if (obj.hierarchy) {
                            if (tmpNome != "") {
                                tmpNome += " - ";
                            }

                            tmpNome += obj.hierarchy;
                        }                   
                    } else if (tmp[i] == "page") {
                        if (obj.page) {
                            if (tmpNome != "") {
                                tmpNome += " ";
                            }

                            if (obj.page.length > 1) {
                                tmpNome += "(pp. " + obj.page + ")";
                            } else {
                                tmpNome += "(p. " + obj.page + ")";
                            }
                        }
                    } else {
                        let prop = this.getMetadataInfoFromLabel(tmp[i]);
                        if (prop !== null) {
                            if (prop.field.startsWith("external_metadata")) {
                                let split = prop.field.split(".");
                                if (obj.external_metadata && obj.external_metadata[split[1]]) {
                                    if (tmpNome != "") {
                                        tmpNome += " | ";
                                    }

                                    tmpNome += obj.external_metadata[split[1]][0];
                                }
                            } else {
                                if (obj[prop.field]) {
                                    if (tmpNome != "") {
                                        tmpNome += " | ";
                                    }

                                    tmpNome += " " + obj[prop.field][0];
                                }
                            }
                        }
                    }
                }
                tmpNome = tmpNome.trim();

                text += "<span class='titlePopup d-inline-block text-truncate' style='max-width: calc(100% - 130px); position: absolute; top: -2px;'>" + tmpNome + " </span>";

                text += "<div class='progress' style='position: absolute; width: 100px; display: inline-flex; right: 25px; top: 1px; background-color: white'>";
                text += " <div class='progress-bar' role='progressbar' style='width: " + Math.trunc(obj.score * 100) + "%;' aria-valuenow='25' aria-valuemin='0' aria-valuemax='100'></div>";
                text += "</div>";

                let isBoosted = false;
                if (obj.type == "question" || obj.type == "similar_question") {
                    isBoosted = true;
                }

                if (!vote_query) {

                } else if (voteMap[obj.question_id] && voteMap[obj.question_id][obj.filename]) {
                    text += '     <i info="' + obj.question_id + obj.filename + '" class="fa fa-star inserted" aria-hidden="true" title="Vote Query" style="cursor: pointer; position: absolute; top: 2px; right: 6px;"></i>'
                } else {
                    text += '     <i class="fa fa-star voteQuery" aria-hidden="true" title="Vote Query" style="cursor: pointer; position: absolute; top: 2px; right: 6px;"></i>'
                }

                text += '   </div>';
                text += '  <div class="card-body">';
                text += '    <p class="card-category" style="font-weight: 700; margin-top: 0;">' + obj.last_title + '</p>';
                text += '     <p class="card-category">';
                
                text += obj.snippet

                text += '     </p>';
                text += '   </div>';
                text += '   <div class="card-footer">';
                text += '     <div class="stats" style="padding-left: 3px;">';
                text += '     </div>';
                text += '   </div>';

                if (isBoosted && obj.question) {
                    text += '<div style="margin-right: 2px; color: #999999; padding-left: 5px !important; font-size: 12px;">Related question: ' + obj.question + "</div>";
                }

                text += ' </div>';

            }

            if (text == "") {
                text = "No document found!";
            }
            $("#answersList").append(text);

            // add side note buttons
            let sideNoteFound = false
            for (let i = 0; i < objs.length; i++) {
                let obj = objs[i];
                if (obj.side_note) {
                    sideNoteFound = true;
                    let base = $("#answersList [id-vet=" + i + "] .card-footer");
                    let sideNoteHtmlButton = '<span style="color: var(--primaryColor-100); cursor: pointer;" class="material-icons sideNote">description</span>';
                    base.append(sideNoteHtmlButton)
                }
            }

            if (sideNoteFound) {
                $('.sideNote').off("click");

                let more = $('.sideNote').popover({
                    html: true,
                    sanitize: false,
                    content: function () {
                        let idx = $(this).closest(".viewQa").attr("id-vet");
                        return "<div class='math-container'> " + objs[idx].side_note.replaceAll("\n", "<br/>") + " </div>";
                    },
                    placement: 'top',
                    title: function () {
                        let title = "";
                        return title;
                    },
                    container: 'body',
                    trigger: 'click'
                });

                $('.sideNote').on("click", function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                })

                more.on('inserted.bs.popover', function (e) {
                    let tip = $($(this).data("bs.popover").tip);
                    tip.find(".arrow").hide();
                    tip.css("z-index", "999999");
                    MathJax.typesetPromise($(".math-container")).then(() => { });
                });

                more.on('shown.bs.popover', function (e) {
                    let tip = $($(this).data("bs.popover").tip);
                    tip.find(".arrow").hide();
                    tip.css("z-index", "999999");
                    MathJax.typesetPromise($(".math-container")).then(() => { });
                });
            }


            $("body").off("click", ".voteQuery");
            $("body").on("click", ".voteQuery", function (e) {
                e.stopPropagation();
                let idObj = parseInt($(this).closest(".viewQa").attr("id-vet"));
                let voteQuery = $(this).closest(".viewQa").find(".voteQuery").eq(0);

                let obj = objs[idObj];
                console.log(obj);

                $(this).removeClass("fa-star");
                $(this).addClass("fa-spinner");
                $(this).addClass("fa-spin");

                const queryString = window.location.search;
                const urlParams = new URLSearchParams(queryString);
                const id = urlParams.get('id');

                let el = $(this);

                $.ajax({
                    url: global.api_url + '/steps/' + id + '/qa/store_vote',
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        answer_id: obj.document_id,
                        filename: obj.filename,
                        query: latestResponse.query,
                        origin_index: obj.index
                    },
                    success: function (jsonResponse) {
                        console.log("store_vote response -->", jsonResponse);
                        $.notify({
                            icon: "add_alert",
                            message: "Vote inserted!"
                        }, {
                            type: 'success',
                            timer: 3000,
                            placement: {
                                from: 'top',
                                align: 'right'
                            }
                        });
                        that.loadQaVote(id);
                        
                        voteQuery.attr("info", jsonResponse.question_id + obj.filename);

                        voteQuery.addClass("inserted");

                        el.removeClass("fa-spinner");
                        el.removeClass("fa-spin");
                        el.addClass("fa-star");
                    }, error: function (request) {
                        if (request.responseText) {
                            $.notify({
                                icon: "add_alert",
                                message: request.responseText
                            }, {
                                type: 'danger',
                                timer: 3000,
                                placement: {
                                    from: 'top',
                                    align: 'right'
                                }
                            });
                        }
                        el.removeClass("fa-spinner");
                        el.removeClass("fa-spin");
                        el.addClass("fa-star");
                    }
                });

            });

            $("body").off("click", ".viewQa");
            $("body").on("click", ".viewQa", function (e) {
                e.stopPropagation();
                
                if ($(this).hasClass("select")) {
                    $(".viewQa").removeClass("select");
                    $(".reference").removeClass("selectRef");
                    iframe[0].contentWindow.postMessage({
                        clear: "highlight"
                    }, "*");
                } else {
                    $(".viewQa").removeClass("select");
                    $(".reference").removeClass("selectRef");
                    $(this).addClass("select");
                    let id = parseInt($(this).attr("id-vet"));
                    let obj = objs[id];

                    let qa = {
                        start: obj.position.start,
                        end: obj.position.end,
                        splitStart: obj.split_position ? obj.split_position.start : null,
                        splitEnd: obj.split_position ? obj.split_position.end : null,
                        highlights: []
                    };

                    if (obj.no_pdf) {
                        qa['courtesyView'] = {
                            content: obj.rendered_content
                        }
                    }

                    if (filesStep[obj.filename].position == $("#documentsQA").val()) {
                        iframe[0].contentWindow.postMessage({
                            qa: qa
                        }, "*");
                    } else {
                        $("#documentsQA").val(filesStep[obj.filename].position);
                        $("#documentsQA").change();
                        let interval = setInterval(function () {
                            if (iframeReady) {
                                clearInterval(interval);

                                setTimeout(function () {
                                    iframe[0].contentWindow.postMessage({
                                        qa: qa
                                    }, "*");
                                }, 500);
                            }
                        }, 100);
                    }

                }
            });

            let more = $('.titlePopup').popover({
                html: true,
                sanitize: false,
                content: function () {
                    return $(this).text();
                },
                placement: 'top',
                title: function () {
                    let title = "";
                    return title;
                },
                container: 'body',
                trigger: 'hover',
                delay: { "show": 1000, "hide": 100 }
            });

            more.on('inserted.bs.popover', function () {
                let tip = $($(this).data("bs.popover").tip);
                tip.find(".arrow").hide();
                tip.css("z-index", "999999");
            });

        } else {
            $.notify({
                icon: "add_alert",
                message: jsonResponse.error
            }, {
                type: 'danger',
                timer: 3000,
                placement: {
                    from: 'top',
                    align: 'right'
                }
            });
        }
    }

    this.neuralSimilarityChangeLogic = function (language, similarity, prevSimilarity) {

        if (prevSimilarity == null) {
            prevSimilarity = similarity;
        }

        let groupDiv = $(".scoreParams[group='neural']");

        let params = tempLanguageParameters[language]["neural"].normalization_params[similarity];
        let prev = tempLanguageParameters[language]["neural"].normalization_params[prevSimilarity];

        let range1min = groupDiv.find(".range1min");

        prev.min_score[0] = range1min.val()
        range1min.val(params.min_score[0]).trigger("change");

        let range1max = groupDiv.find(".range1max");
        prev.max_score[0] = range1max.val()
        range1max.val(params.max_score[0]).trigger("change");

        let lambda = groupDiv.find(".lambda");
        prev.lambda = lambda.val();
        lambda.val(params.lambda).trigger("change");

    }

    this.crossEncoderSimilarityChangeLogic = function (language, prevLang) {
        if (prevLang == null) {
            prevLang = language;
        }

        let groupDiv = $(".crossEncoderParams");

        let curr = tempLanguageParameters[language]["cross_encoder"];
        let prev = tempLanguageParameters[prevLang]["cross_encoder"];

        let modelContainer = groupDiv.find(".model");
        prev.model = modelContainer.val();
        modelContainer.val(curr.model).trigger("change");

    }

    this.langSettingsChangeLogic = function () {

        let langSettingsDivs = $(".langSettings").parents();
        let previousLangs = {}

        for (let i = 0; i < langSettingsDivs.length; i++) {
            let group = $(langSettingsDivs[i]).attr("group");
            previousLangs[group] = $(langSettingsDivs[i]).find(".langSettings").val();
        }

        $(".langSettings").change(function () {

            let language = $(this).val();
            let group = $(this).parent().attr("group");

            let previousLang = previousLangs[group]

            let groupDiv = $(".scoreParams[group='" + group + "']");

            let params = tempLanguageParameters[language][group];
            let prev = tempLanguageParameters[previousLang][group];

            let range1min = groupDiv.find(".range1min");

            let prevScores;
            let curr;

            if (!prev || !prev.normalization_params) {
                return;
            }

            if (group == "neural") {

                let similarityDiv = groupDiv.find(".similarity");

                prev.default_similarity = similarityDiv.val();

                similarityDiv.val(params.default_similarity).trigger("change");

                prevScores = prev.normalization_params[similarityDiv.val()];
                curr = params.normalization_params[similarityDiv.val()];

            } else {
                prevScores = prev.normalization_params.symbolic;
                curr = params.normalization_params.symbolic;
            }

            prevScores.min_score[0] = range1min.val()
            range1min.val(curr.min_score[0]).trigger("change");

            let range1max = groupDiv.find(".range1max");
            prevScores.max_score[0] = range1max.val()
            range1max.val(curr.max_score[0]).trigger("change");

            let lambda = groupDiv.find(".lambda");
            prevScores.lambda = lambda.val();
            lambda.val(curr.lambda).trigger("change");

            if (group == "elastic") {
                let range2min = groupDiv.find(".range2min");
                prevScores.min_score[1] = range2min.val();
                range2min.val(curr.min_score[1]).trigger("change");

                let range2max = groupDiv.find(".range2max");
                prevScores.max_score[1] = range2max.val();
                range2max.val(curr.max_score[1]).trigger("change");
            }

            previousLangs[group] = language;
        });

    }

    this.languageFilter = function () {

        let countries = [];
        for (let i = 0; i < packLanguages.length; i++) {
            countries.push(languageFlags[packLanguages[i]])
        }

        let values = [];
        let valuesArray = [];

        for (let i = 0; i < countries.length; i++) {

            if (packLanguages[i] != "english") {
                values.push(
                    {
                        value: packLanguages[i],
                        label: '<span title="' + capitalize(packLanguages[i]) + ' "class="fi fi-' + countries[i] + '"></span>',
                        id: i
                    }
                )

            } else {
                values.push(
                    {
                        value: packLanguages[i],
                        label: '<span title="' + capitalize(packLanguages[i]) + '" class="fi" style="background-image: url(images/english.png)"></span>',
                        id: i
                    }
                )
            }

            valuesArray.push(values[i].value);

        }

        if (selectpicker) {
            selectpicker.destroy();
        }

        selectpicker = new Choices("#countrySelect",
            {
                duplicateItemsAllowed: false,
                removeItemButton: true,
                choices: values,
                allowHTML: true,
                loadingText: '',
                noResultsText: '',
                noChoicesText: '',
                itemSelectText: '',
                uniqueItemText: '',
                customAddItemText: ''
            }
        );

        selectpicker.setChoiceByValue(valuesArray);

        $("#countrySelect").on("change", function () {
            if ($(this).val().length == 1) {
                selectpicker.config.removeItems = false;
                selectpicker.removeHighlightedItems();
            } else {
                selectpicker.config.removeItems = true;
            }
        });

        $("#countrySelect").trigger("change");
        $("#countrySelect").show();

    }


    this.metadataTemplateToTitle = function () {
        if (metadataTemplateChoicesToTitle) {
            metadataTemplateChoicesToTitle.destroy();
        }

        $(".metadataTemplateChoicesNoTitleDisplay").hide();

        let allMetadataTemplates = []

        for (let idx in metadata) {
            if (!default_metadata_template_to_title.includes(metadata[idx].label)) {
                allMetadataTemplates.push(metadata[idx].label)
            }
        }

        for (let idx in default_metadata_template_to_title) {
            allMetadataTemplates.push(default_metadata_template_to_title[idx])
        }

        let html = ""

        for (let k = 0; k < allMetadataTemplates.length; k++) {
            html += '            <option value="' + allMetadataTemplates[k] + '">' + allMetadataTemplates[k] + '</option>';
        }

        $("#metadata_visualize").html(html);

        metadataTemplateChoicesToTitle = new Choices("#metadata_visualize", {
            itemSelectText: 'Insert',
            noChoicesText: 'No more metadata to insert',
            duplicateItemsAllowed: false,
            removeItemButton: true,
            addItems: true
        });

        $("#metadata_visualize").parents(".choices").css("width", "94%");

        metadataTemplateChoicesToTitle.setChoiceByValue(metadata_template_to_title);

        $(".metadataTemplateChoicesNoTitleDisplay").find("[name='search_terms']").hide();
        $(".metadataTemplateChoicesNoTitleDisplay").show();
    }



    this.pollQaTask = function (index, idRoot, task_id, retrievedResults, partial_data = undefined, callInterval = 200) {

        that = this;
        let data = {
            task_id: task_id,
            idRoot: idRoot
        }

        if (partial_data) {
            data['partial_data'] = partial_data;
        }

        $.ajax({

            url: global.api_url + 'steps/' + index + "/qa/query",
            type: 'POST',
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function (jsonResponse) {

                if (runnningTask != task_id) return;

                if (jsonResponse.success === true) {

                    if (jsonResponse.completed_tasks) {

                        if (jsonResponse.completed_tasks.includes("RETRIEVAL")) {

                            if (retrievedResults == null) {
                                retrievedResults = jsonResponse
                            }

                            that.showQaResults(retrievedResults, index);
                        }

                    }

                    if (!jsonResponse.completed) {
                        setTimeout(function () {
                            that.pollQaTask(index, idRoot, task_id, retrievedResults, partial_data, callInterval);
                        }, callInterval);
                    }

                } else {
                    $(".btnContainer").show();
                    $("#answersList").html("");
                    console.error(jsonResponse)

                    if (jsonResponse.error) {
                        $.notify({
                            icon: "add_alert",
                            message: jsonResponse.error
                        }, {
                            type: 'danger',
                            timer: 3000,
                            placement: {
                                from: 'top',
                                align: 'right'
                            }
                        });
                    }
                }

            }, error: function (request) {
                $(".btnContainer").show();

                $("#answersList").html("");
                if (request.responseText) {
                    $.notify({
                        icon: "add_alert",
                        message: request.responseText
                    }, {
                        type: 'danger',
                        timer: 3000,
                        placement: {
                            from: 'top',
                            align: 'right'
                        }
                    });
                }
                console.error(request);
            }
        });

        return task_id
    }

    this.loadQA = function (idRoot, id) {

        let that = this;
        let loadDefaultConfig = true;

        that.loadQaVote(id);

        if (splitBar != null) {
            splitBar.destroy();
        }

        splitBar = Split(['#split-0', '#split-1'], {
            minSize: 250,
            sizes: [30, 70]
        });

        $(".qATab").show();
        $("#answersList").css("height", "calc(100vh - 200px)");

        ///////// Custom advance //////////////

        $('#settingGeneral').click(function () {
            $("#advancedSettingGeneral .modal-content").draggable();
            $("#advancedSettingGeneral .modal-content").resizable({
                containment: "#animatedModal",
                minHeight: 300,
                minWidth: 300
            });
            $("#advancedSettingGeneral").modal("show");

        });

        $('#advancedSettingGeneral').off('hidden.bs.modal');
        $('#advancedSettingGeneral').on('hidden.bs.modal', function (e) {
            $("#advancedSettingGeneral .modal-content").draggable("destroy");
            $("#advancedSettingGeneral .modal-content").resizable("destroy");
        });

        ///////////////////////////////////////////////////////

        let opt = $('#settingQa').popover({
            html: true,
            sanitize: false,
            content: function () {

                let checkbox1 = getExpandQuery ? ' checked' : '';
                let checkbox2 = getDebug ? ' checked' : '';
                let checkboxStats = getStatistics ? ' checked' : '';

                let customElasticRangesCheckbox = getCustomElasticRanges ? ' checked' : '';
                let groupSubPassagesCheckbox = group_sub_passages ? ' checked' : '';
                let enable_filter_buttonCheckbox = enable_filter_button ? ' checked' : '';
                let vote_queryCheckbox = vote_query ? ' checked' : '';

                let htmlOpt = '';

                // MENU

                htmlOpt += '<div class="row popoverContainer" style="border-bottom: 1px solid #AAA; margin-left: -15px !important; margin-top: -10px !important;">';
                htmlOpt += '<div class="col-md-3" style="min-height: 350px; background: #e7e7e7; padding: 0;">';

                htmlOpt += '    <ul class="nav nav-tabs" style="text-align: right; display:contents; width: max-content;">';
                htmlOpt += '         <li class="nav-item">';
                htmlOpt += '             <a class="nav-link active special" data-toggle="tab" href="#query">Q&amp;A Workflow</a>';
                htmlOpt += '         </li>';
                htmlOpt += '         <li class="nav-item">';
                htmlOpt += '             <a class="nav-link special" data-toggle="tab" href="#symbolic">Symbolic</a>';
                htmlOpt += '         </li>';
                htmlOpt += '         <li class="nav-item">';
                htmlOpt += '             <a class="nav-link special" data-toggle="tab" href="#neural">Neural</a>';
                htmlOpt += '         </li>';
                htmlOpt += '         <li class="nav-item">';
                htmlOpt += '             <a class="nav-link special" data-toggle="tab" href="#crossEncoder">Cross Encoder</a>';
                htmlOpt += '         </li>';
                htmlOpt += '         <li class="nav-item">';
                htmlOpt += '             <a class="nav-link special" data-toggle="tab" href="#uisetting">UI SETTING</a>';
                htmlOpt += '         </li>';
                htmlOpt += '    </ul>';
                htmlOpt += '</div>';

                // OPEN BODY
                htmlOpt += '<div class="col-md-9">';
                htmlOpt += '    <div class="tab-content" style="min-height: 150px;">'

                //UI SETTING
                htmlOpt += '         <div id="uisetting" class="container tab-pane fade" style="min-height: 346px; margin-right: -25px !important; width: calc(100% + 25px);">';
                htmlOpt += linespacer;
                htmlOpt += '             <h4>UI Settings</h4>';
                htmlOpt += '             </br>';
                htmlOpt += '             <div class="metadataTemplateChoicesNoTitleDisplay">';
                htmlOpt += '                 <label class="form-check-label" style="margin-top: 7px; margin-right: 15px; width: fit-content !important;">';
                htmlOpt += '                 <span style="color: #555;">Metadata to visualize</span>';
                htmlOpt += '                 </label>';
                htmlOpt += '                 </br>';
                htmlOpt += '                 <select multiple id="metadata_visualize" style="margin-top: 2px; margin-left: 0px; width: 80%;">';

                for (let k = 0; k < default_metadata_template_to_title.length; k++) {
                    htmlOpt += '            <option value="' + default_metadata_template_to_title[k] + '">' + default_metadata_template_to_title[k] + '</option>';
                }

                htmlOpt += '                 </select>';
                htmlOpt += '             </div>'

                htmlOpt += '         </div>'

                // SYMBOLIC

                htmlOpt += '         <div id="symbolic" class="container tab-pane fade">';
                htmlOpt += linespacer;
                htmlOpt += '             <h4>Symbolic Settings</h4>';
                htmlOpt += '             </br>';

                // expand query
                htmlOpt += '             <label class="form-check-label" style="display: contents;">';
                htmlOpt += '                <span style="color: #555; margin-right: 207px;">Expand Query</span>';
                htmlOpt += '             </label>';
                htmlOpt += '             <input class="form-check-input getExpandQuery" type="checkbox"' + checkbox1 + ' style="margin-left: 4px; margin-top: 2px;"/>';

                htmlOpt += linespacer;
                htmlOpt += '             <label class="form-check-label" style="margin-top: 7px; margin-right: 182px; width: fit-content !important;">';
                htmlOpt += '             <span style="color: #555;">Entity boost</span>';
                htmlOpt += '             </label>';
                htmlOpt += '             <input class="form-check-input entity_boost" value="' + entity_boost + '" type="number" style=""/>';

                htmlOpt += linespacer;
                htmlOpt += '             <label class="form-check-label" style="margin-top: 7px; margin-right: 147px; width: fit-content !important;">';
                htmlOpt += '             <span style="color: #555;">Expansion boost</span>';
                htmlOpt += '             </label>';
                htmlOpt += '             <input class="form-check-input expansion_boost" value="' + expansion_boost + '" type="number" step=".01" min="0" max="1" style=""/>';
                htmlOpt += linespacer;

                htmlOpt += '             <label class="form-check-label" style="display: contents;">';
                htmlOpt += '                <span style="color: #555; margin-right: 156px; margin-top: 10px;">Custom Score Ranges</span>';
                htmlOpt += '             </label>';
                htmlOpt += '             <input class="form-check-input getCustomElasticRanges" type="checkbox"' + customElasticRangesCheckbox + ' style="margin-left: 4px; margin-top: 12px;"/>';

                if (getCustomElasticRanges) {
                    htmlOpt += '         <div id="elasticScores">'
                } else {
                    htmlOpt += '         <div id="elasticScores" style="display: none;">'
                }

                htmlOpt += that.addScoreParams("elastic")
                htmlOpt += '             </div>';

                htmlOpt += '         </div>';

                // NEURAL

                htmlOpt += '         <div id="neural" class="container tab-pane fade">';
                htmlOpt += linespacer;
                htmlOpt += '             <h4>Neural Settings</h4>';
                htmlOpt += '             </br>';

                htmlOpt += linespacer;

                htmlOpt += that.addScoreParams("neural")

                htmlOpt += '         </div>';

                // CROSS ENCODER
                htmlOpt += '         <div id="crossEncoder" class="container tab-pane fade">';
                htmlOpt += linespacer;
                htmlOpt += '             <h4>Cross Encoder Settings</h4>';
                htmlOpt += '             </br>';

                htmlOpt += linespacer;

                htmlOpt += that.crossEncoderSelection()

                htmlOpt += '         </div>';

                //QUERY

                htmlOpt += '         <div id="query" class="container tab-pane active" style="margin-right: -25px !important; width: calc(100% + 25px);">';
                htmlOpt += linespacer;
                htmlOpt += '             <h4>Q&A Parameters Configuration</h4>';
                htmlOpt += '             <span style="color: #555; margin-right:80px;">Configuration</span>';
                htmlOpt += '             <select class="form-check configList" style="margin-left: 4px; margin-top: 2px;">';
                htmlOpt += that.generateConfigSelect(configList);
                htmlOpt += '             </select>';

                htmlOpt += linespacer + linespacer;

                htmlOpt += '             <h4>Query Settings</h4>';

                htmlOpt += '            <div class="row"><div class="col-md-5">'
                htmlOpt += '            <label class="form-check-label" style="display: contents;">';
                htmlOpt += '            <span style="color: #555;">Enable Debug</span>';
                htmlOpt += '            </label>';
                htmlOpt += '            <input class="form-check-input getDebug" type="checkbox"' + checkbox2 + ' style="margin-left: 4px;"/>';
                htmlOpt += '            </div>'

                htmlOpt += '            <div class="col-md-7">'
                htmlOpt += '            <label class="form-check-label" style=" margin-right: 6px; width: fit-content !important;">';
                htmlOpt += '                <span style="color: #555;">Enable Edit Passages</span>';
                htmlOpt += '            </label>';
                htmlOpt += '            </div></div>'

                //Metadata Statistics
                htmlOpt += '            <div class="row"><div class="col-md-12">'
                htmlOpt += '            <label class="form-check-label" style="display: contents;">';
                htmlOpt += '            <span style="color: #555;">Enable Metadata Statistics</span>';
                htmlOpt += '            </label>';
                htmlOpt += '            <input class="form-check-input getStatistics" type="checkbox"' + checkboxStats + ' style="margin-left: 4px;"/>';
                htmlOpt += '            </div></div>'

                // filters
                htmlOpt += linespacer;
                htmlOpt += '            <label class="form-check-label" style="margin-right:49px; width: fit-content !important;">';
                htmlOpt += '            <span style="color: #555;">Querying modules</span>';
                htmlOpt += '            </label>';
                htmlOpt += '            <select class="form-check filtersList" style="margin-left: 4px; margin-top: 2px;">';
                htmlOpt += that.generateHybridSelect(filters)
                htmlOpt += '            </select>';

                // modes
                htmlOpt += linespacer;
                htmlOpt += '            <label class="form-check-label" style="margin-right:55px; width: fit-content !important;">';
                htmlOpt += '            <span style="color: #555;">Ranking modules</span>';
                htmlOpt += '            </label>';
                htmlOpt += '            <select class="form-check modesList" style="margin-left: 4px; margin-top: 2px;">';
                htmlOpt += that.generateHybridSelect(modes, true)
                htmlOpt += '            </select>';

                // top_k_docs
                htmlOpt += linespacer;
                htmlOpt += '            <label class="form-check-label" style="margin-top: 7px; margin-right: 75px; width: fit-content !important;">';
                htmlOpt += '                <span style="color: #555;">Number of answer passages</span>';
                htmlOpt += '            </label>';
                htmlOpt += '            <input class="form-check-input top_k_docs" value="' + top_k_docs + '" type="number" style=""/>';

                // group_sub_passages
                htmlOpt += linespacer;
                htmlOpt += '            <label class="form-check-label" style="margin-top: 7px; margin-right: 163px; width: fit-content !important;">';
                htmlOpt += '                <span style="color: #555;">Group split passages</span>';
                htmlOpt += '            </label>';
                htmlOpt += '            <input class="form-check-input group_sub_passages" type="checkbox"' + groupSubPassagesCheckbox + ' style="margin-left: 4px; margin-top: 2px;"/>';

                htmlOpt += linespacer;

                htmlOpt += '            <label class="form-check-label" style="margin-top: 7px; margin-right: 125px; width: fit-content !important;">';
                htmlOpt += '                <span style="color: #555;">Enable vote query example</span>';
                htmlOpt += '            </label>';
                htmlOpt += '            <input class="form-check-input vote_query" type="checkbox"' + vote_queryCheckbox + ' style="margin-left: 4px; margin-top: 2px;"/>';

                htmlOpt += '            <label class="form-check-label" style="margin-top: 7px; margin-right: 178px; width: fit-content !important;">';
                htmlOpt += '                <span style="color: #555;">Enable filter button</span>';
                htmlOpt += '            </label>';
                htmlOpt += '            <input class="form-check-input enable_filter_button" type="checkbox"' + enable_filter_buttonCheckbox + ' style="margin-left: 4px; margin-top: 2px;"/>';

                htmlOpt += linespacer;

                htmlOpt += '      </div>';

                htmlOpt += '  </div>';
                htmlOpt += '</div></div>';

                htmlOpt += '</br>';
                htmlOpt += '<div style="text-align: center;">';
                htmlOpt += '    <button type="button" class="btn btn-secondary cancelSetting">CANCEL</button>';
                htmlOpt += '    <button type="button" class="btn trySetting">TRY</button>';

                htmlOpt += '    <button type="button" class="btn btn-warning editSetting">STORE</button>';

                htmlOpt += '</div>';

                return htmlOpt;
            },
            placement: 'top',
            title: function () {
                let title = '<div style="margin: -15px -15px -5px!important; padding: 15px !important; background: #e7e7e7">Advanced Settings</div>';
                return title;
            },
            container: '#animatedModal',
            trigger: 'click'
        })

        opt.popover("hide");

        opt.off('show.bs.popover');
        opt.on('show.bs.popover', function () {
            $($(this).data("bs.popover").tip).addClass("custom-popover-scale");
        });

        opt.off('inserted.bs.popover');
        opt.on('inserted.bs.popover', function () {

            $(".filtersList").select2({ width: '50%', dropdownCssClass: "smallFont" });
            $(".modesList").select2({ width: '50%', dropdownCssClass: "smallFont" });
            $(".configList").select2({ width: '50%', dropdownCssClass: "smallFont" });

            $(".similarity").select2({ width: '50%', dropdownCssClass: "smallFont" });

            $(".langSettings").select2({ width: '50%', dropdownCssClass: "smallFont" });

            $(".langCeSettings").select2({ width: '50%', dropdownCssClass: "smallFont" }).trigger("change");
            $(".langCeEvalData").select2({ width: '50%', dropdownCssClass: "smallFont" }).trigger("change");
            $(".crossEncoderParams > .model").select2({ width: '50%', dropdownCssClass: "smallFont" }).trigger("change");

            $(".enable_filter_button").trigger("change");

            $(".use_beam_search").change(function () {
                if ($(this).is(':checked')) {
                    $("#sampling").hide();
                    $("#num_beams_text").show();
                    $("#num_samples_text").hide();
                } else {
                    $("#sampling").show();
                    $("#num_beams_text").hide();
                    $("#num_samples_text").show();
                }
            });

            $(".use_beam_search").trigger("change");

            $(".getCustomElasticRanges").change(function () {
                if ($(this).is(':checked')) {
                    $("#elasticScores").show();
                } else {
                    $("#elasticScores").hide();
                }
            });

            let prevSimilarity;
            $(".similarity").change(function () {
                if (prevSimilarity != $(".similarity").val()) {
                    let language = $(".langSettings").val();
                    that.neuralSimilarityChangeLogic(language, $(".similarity").val(), prevSimilarity);
                    prevSimilarity = $(".similarity").val();

                }

            });

            $(".similarity").trigger("change");

            let prevCELang;

            $(".langCeSettings").change(function () {
                if (prevCELang != $(".langCeSettings").val()) {
                    let language = $(".langCeSettings").val();
                    that.crossEncoderSimilarityChangeLogic(language, prevCELang);
                    prevCELang = language;
                }
            });

            $(".langCeSettings").trigger("change");

            that.langSettingsChangeLogic();

            let prevConfig = $(".configList").val();
            $(".configList").change(function (event, message) {
                currentConfig = $(this).val();

                if (message) {
                    that.loadConfiguration(idRoot, id, prevConfig, message.forcedStoredConfig);
                } else {
                    that.loadConfiguration(idRoot, id, prevConfig);
                }

                prevConfig = currentConfig;
            });

            that.updateLangSettings(packLanguages);

        });

        opt.off('shown.bs.popover');
        opt.on('shown.bs.popover', function () {

            // ADD STOP TOKENS

            that.metadataTemplateToTitle();

            if (loadDefaultConfig === true) {
                that.loadEnvParams(idRoot, id, currentConfig);
                loadDefaultConfig = false
            }

            $(".cancelSetting").unbind();
            $(".cancelSetting").click(function () {
                opt.popover("hide");
            });

            let persistModal = $('.editSetting').popover({
                html: true,
                sanitize: false,
                content: function () {
                    let persistHtml = '';
                    persistHtml += '<div>'
                    persistHtml += '    <div style="display: inline-grid; justify-items: center; margin-left: 11.5px; width: 100%;">'
                    persistHtml += '        <label class="form-check-label" style="width: fit-content !important;">';
                    persistHtml += '            <span style="color: #555; margin-left: -11.5px;">Configuration Name</span>';
                    persistHtml += '        </label>';
                    persistHtml += '        <input class="form-check-input persistConfigName" value="' + currentConfig + '" style="width: 60%;"/>';
                    persistHtml += '    </div>'
                    persistHtml += linespacer + linespacer;
                    persistHtml += '    <div style="text-align: center;">';
                    persistHtml += '        <button type="button" class="btn btn-secondary cancelPersistSetting">CANCEL</button>';
                    persistHtml += '        <button type="button" class="btn btn-warning persistSetting">STORE</button>';
                    persistHtml += '    </div>';
                    persistHtml += '</div>'

                    return persistHtml;
                },
                placement: 'top',
                title: function () {
                    let title = "Persist Configuration?";
                    return title;
                },
                container: '.popoverContainer',
                trigger: 'click'
            });

            persistModal.on('inserted.bs.popover', function () {
                let tip = $($(this).data("bs.popover").tip);
                tip.find(".arrow").hide();
                tip.css("z-index", "999999");
                tip.css("margin", "-20px");
                tip.css("width", "800px");
                tip.css("height", "250px");
            });

            let saveConfig = function (hide = true) {

                getExpandQuery = $(".getExpandQuery").is(':checked');
                getCustomElasticRanges = $(".getCustomElasticRanges").is(':checked');
                entity_boost = $(".entity_boost").val();
                expansion_boost = $(".expansion_boost").val();
                getDebug = $(".getDebug").is(':checked');
                getStatistics = $(".getStatistics").is(':checked');

                modes = $(".modesList").val();
                filters = $(".filtersList").val();
                currentConfig = $(".configList").val();
                top_k_docs = $(".top_k_docs").val();
                group_sub_passages = $(".group_sub_passages").is(':checked');
                vote_query = $(".vote_query").is(':checked');
                enable_filter_button = $(".enable_filter_button").is(':checked');

                metadata_template_to_title = metadataTemplateChoicesToTitle.getValue(true);

                if ($(".langSettings").length > 0) {
                    let groups = ["elastic", "neural"];
                    for (let i = 0; i < groups.length; i++) {
                        let group = groups[i];

                        let groupDiv = $(".scoreParams[group='" + group + "']");
                        let language = groupDiv.find(".langSettings").val();

                        if (group == "elastic") {

                            let groupData = tempLanguageParameters[language][group].normalization_params.symbolic;

                            groupData.min_score[0] = groupDiv.find(".range1min").val();
                            groupData.max_score[0] = groupDiv.find(".range1max").val();
                            groupData.lambda = groupDiv.find(".lambda").val();

                            groupData.min_score[1] = groupDiv.find(".range2min").val();
                            groupData.max_score[1] = groupDiv.find(".range2max").val();
                        }

                        if (group == "neural") {

                            tempLanguageParameters[language][group].default_similarity = groupDiv.find(".similarity").val();

                            let groupData = tempLanguageParameters[language][group].normalization_params;
                            let groupSimilarity = tempLanguageParameters[language][group].default_similarity;

                            groupData[groupSimilarity].min_score[0] = groupDiv.find(".range1min").val();
                            groupData[groupSimilarity].max_score[0] = groupDiv.find(".range1max").val();
                            groupData[groupSimilarity].lambda = groupDiv.find(".lambda").val();

                        }
                    }

                    if ($(".langCeSettings").length > 0) {
                        let language = $(".langCeSettings").val();
                        tempLanguageParameters[language]["cross_encoder"].model = $(".crossEncoderParams").find(".model").val()
                        crossEncoderContent = $(".langCeEvalData").val();
                        for (let l in tempLanguageParameters) {
                            tempLanguageParameters[l]["cross_encoder"].evaluated_content = (crossEncoderContent == "content") ? "content" : "embedding_content";
                        }
                    }

                    languageParameters = deepCopy(tempLanguageParameters)
                }

                if (hide === true) {
                    opt.popover("hide");
                }

                if (enable_filter_button) {
                    $("#filterQa").show()
                } else {
                    $("#filterQa").hide();
                }


            }

            $(".trySetting").unbind();
            $(".trySetting").click(function () {
                saveConfig();
            });

            function runPersistConfig(config, prevConfigData) {
                if (config == defaultConfigName) {
                    $.notify({
                        icon: "add_alert",
                        message: "Cannot overwrite system default config"
                    }, {
                        type: 'danger',
                        timer: 1000,
                        placement: {
                            from: 'top',
                            align: 'right'
                        }
                    });
                } else {
                    that.persistConfig(idRoot, id, config, prevConfigData)
                }
            }

            persistModal.on('shown.bs.popover', function () {
                $(".cancelPersistSetting").unbind();
                $(".cancelPersistSetting").click(function () {
                    persistModal.popover("hide");
                });

                $(".persistSetting").unbind();
                $(".persistSetting").click(function () {

                    storedTemp = {
                        languageParameters: languageParameters,
                        packLanguages: packLanguages,
                        envParams: that.storeEnvParams()
                    };

                    let newConfig = $(".persistConfigName").val().trim();
                    saveConfig(false);
                    runPersistConfig(newConfig, { name: currentConfig, data: storedTemp })
                    persistModal.popover("hide");
                });
            });
        });

        let filt = $('#filterQa').popover({
            html: true,
            sanitize: false,
            content: function () {

                let htmlFilt = '';

                // MENU

                // UNCOMMENT TO ACTIVATE SIDEBAR IN POPOVER
                /*htmlFilt += '<div class="row popoverContainer" style="border-bottom: 1px solid #AAA; margin-left: -15px !important; margin-top: -10px !important;">';
                htmlFilt += '<div class="col-md-2" style="min-height: 350px; background: #e7e7e7; padding: 0;">';

                htmlFilt += '    <ul class="nav nav-tabs" style="text-align: right; display:contents; width: max-content;">';
                htmlFilt += '         <li class="nav-item">';
                htmlFilt += '             <a class="nav-link active special" data-toggle="tab" href="#filtersManager">Filters</a>';
                htmlFilt += '         </li>';
                htmlFilt += '    </ul>';
                htmlFilt += '</div>';
                */
                //htmlFilt += '<div class="col-md-9">';

                //END

                // COMMENT TO DEACTIVATE SIDEBAR IN POPOVER

                htmlFilt += '<div class="row popoverContainer" style="justify-content:center; margin-right: 0; margin-left: -20px; padding-right:6px;">';
                htmlFilt += '<ul class="nav nav-tabs" style="text-align: right; display:none; width: max-content;">';
                htmlFilt += '   <li class="nav-item">';
                htmlFilt += '       <a class="nav-link active special" data-toggle="tab" href="#filtersManager">Filters</a>';
                htmlFilt += '   </li>';
                htmlFilt += '</ul>';
                htmlFilt += '<div class="col-md-12">';

                // END

                htmlFilt += '    <div class="tab-content" style="min-height: 150px;">'

                // FILTER MANAGEMENT
                htmlFilt += '         <div id="filtersManager" class="container tab-pane fade active show" style="margin-right: -25px !important; width: calc(100% + 25px);">';
                htmlFilt += linespacer;
                htmlFilt += '             <h4 style="font-weight: bold;">Filters</h4>';
                htmlFilt += '             </br>';

                htmlFilt += '             <div>';

                // get filters
                htmlFilt += '               <div id="existingFilters"> </div>';
                htmlFilt += linespacer;

                htmlFilt += '               <div style="display: flex; flex-direction: row; justify-content: flex-end; align-items: center;">';
                htmlFilt += '                   <h4 style="font-weight: bold;margin-right: 10px;">Add Filter</h4>';
                htmlFilt += '                    <button style="margin-top: -3px;" id="AddFilterButton" class="btn btn-white btn-round btn-just-icon" data-original-title="" title="">';
                htmlFilt += '                	    <i class="material-icons">add_circle</i>';
                htmlFilt += '                    </button>';

                htmlFilt += '                   <h4 style="font-weight: bold;margin-right: 10px;">Monitor Metadata<div class="color: red; count_title count_all_meta" style="color: red; width: 33px; display: inline-flex; padding: 5px 7px; top: -10px; position: relative;">' + selectedMetadata.length + '</div></h4>';
                htmlFilt += '                    <button style="margin-top: -3px;" id="MonitorMetadataButton" class="btn btn-white btn-round btn-just-icon" data-original-title="" title="">';
                htmlFilt += '                	    <i class="material-icons">add_circle</i>';
                htmlFilt += '                    </button>';

                htmlFilt += '                </div>';
                htmlFilt += '              </div>';

                htmlFilt += '         </div>';

                htmlFilt += '  </div>';
                htmlFilt += '</div></div>';

                htmlFilt += '</br>';
                htmlFilt += '<div style="text-align: center;">';
                htmlFilt += '    <button type="button" class="btn btn-secondary cancelFilterSetting">CANCEL</button>';
                htmlFilt += '    <button type="button" class="btn tryFilterSetting">TRY</button>';

                htmlFilt += '    <button type="button" class="btn btn-warning editFilterSetting">STORE</button>';

                htmlFilt += '</div>';

                return htmlFilt;
            },
            placement: 'top',
            title: function () {
                let title = '<div style="margin: -15px -15px -5px!important; padding: 15px !important; background: #e7e7e7">Filter Settings</div>';
                return title;
            },
            container: '#animatedModal',
            trigger: 'click'
        })

        filt.popover("hide");

        filt.off('show.bs.popover');
        filt.on('show.bs.popover', function () {
            $($(this).data("bs.popover").tip).addClass("custom-popover-scale");

            // COMMENT TO ACTIVATE SIDEBAR IN POPOVER
            $($(this).data("bs.popover").tip).css("width", "fit-content");
            // END
        });

        filt.off('inserted.bs.popover');
        filt.on('inserted.bs.popover', function () {

            tmpElasticFilters = deepCopy(elasticFilters);
            tmpActiveElasticFilters = deepCopy(activeElasticFilters);
            that.updateExistingFilters();

            that.editFilterLogic("#AddFilterButton");
            that.monitorMetadata("#MonitorMetadataButton");

            $(".cancelFilterSetting").unbind();
            $(".cancelFilterSetting").click(function () {
                filt.popover("hide");
                $("#MonitorMetadataButton").popover("hide");
            });

            $(".tryFilterSetting").unbind();
            $(".tryFilterSetting").click(function () {
                activeElasticFilters = deepCopy(tmpActiveElasticFilters);
                elasticFilters = deepCopy(tmpElasticFilters);
                filt.popover("hide");
                $("#MonitorMetadataButton").popover("hide");
            });

            let persistFilterModal = $('.editFilterSetting').popover({
                html: true,
                sanitize: false,
                content: function () {
                    let persistHtml = '';
                    persistHtml += '<div>';
                    persistHtml += linespacer;
                    persistHtml += '    <div style="text-align: center;">';
                    persistHtml += '        <button type="button" class="btn btn-secondary cancelPersistFilter">CANCEL</button>';
                    persistHtml += '        <button type="button" class="btn btn-warning persistFilter">STORE</button>';
                    persistHtml += '    </div>';
                    persistHtml += '</div>';

                    return persistHtml;
                },
                placement: 'top',
                title: function () {
                    let title = "Persist Filters?";
                    return title;
                },
                container: '.popoverContainer',
                trigger: 'click'
            });

            persistFilterModal.on('inserted.bs.popover', function () {
                let tip = $($(this).data("bs.popover").tip);
                tip.find(".arrow").hide();
                tip.css("z-index", "99999");
                tip.css("margin", "-20px");
                tip.css("width", "300px");
                tip.css("height", "170px");

                $(".persistFilter").off("click");
                $(".persistFilter").on("click", function () {
                    that.persistFilters(idRoot, id);
                    persistFilterModal.popover("hide");
                    $("#MonitorMetadataButton").popover("hide");
                });

                $(".cancelPersistFilter").off("click");
                $(".cancelPersistFilter").on("click", function () {
                    persistFilterModal.popover("hide");
                    $("#MonitorMetadataButton").popover("hide");
                });

            });

        });

        let htmlLoad = '<div class="lds-facebook">';
        htmlLoad += '<div></div>';
        htmlLoad += '<div></div>';
        htmlLoad += '<div></div>';
        htmlLoad += '</div>';

        function goQa() {

            currenltyHiddenDocs = {};

            $(".btnContainer").hide();
            $("#answersList").html(htmlLoad);

            let query = $("#question").val();
            let reqData = that.buildQaRequest(query, idRoot);

            console.log(reqData);

            let retrievedResults = null;

            $.ajax({
                url: global.api_url + 'steps/' + id + "/qa/query",
                type: 'POST',
                dataType: 'json',
                contentType: 'application/json',
                data: JSON.stringify(reqData),
                success: function (jsonResponse) {
                    if (jsonResponse.success && jsonResponse.task_id) {
                        $("#answersList").html(htmlLoad);
                        runnningTask = that.pollQaTask(id, idRoot, jsonResponse.task_id, retrievedResults);
                    }
                }, error: function (request) {
                    $(".btnContainer").show();
                    //$("#loadQa").hide();
                    $("#answersList").html("");
                    if (request.responseText) {
                        $.notify({
                            icon: "add_alert",
                            message: request.responseText
                        }, {
                            type: 'danger',
                            timer: 3000,
                            placement: {
                                from: 'top',
                                align: 'right'
                            }
                        });
                    }
                    console.error(request);
                }
            });
        }

        $("#sendQa").unbind();
        $("#sendQa").submit(function (event) {
            event.stopPropagation();
            goQa();
            return false;
        });

        $("#searchQa").unbind();
        $("#searchQa").click(function () {
            goQa();
        });
    }

    this.persistFilters = function (idRoot, id) {
        activeElasticFilters = deepCopy(tmpActiveElasticFilters);
        elasticFilters = deepCopy(tmpElasticFilters);

        let data = {
            active: activeElasticFilters,
            filters: elasticFilters,
            selectedMetadata: selectedMetadata
        };

        $.ajax({
            url: global.api_url + 'steps/' + id + "/qa/store_elasticsearch_filters",
            type: 'POST',
            dataType: 'json',
            data: {
                idRoot: idRoot,
                filters: JSON.stringify(data)
            },
            success: function (jsonResponse) {
                console.log(jsonResponse)
                if (jsonResponse.success === true) {

                    $.notify({
                        icon: "add_alert",
                        message: "Filters successfully persisted."
                    }, {
                        type: 'success',
                        timer: 3000,
                        placement: {
                            from: 'top',
                            align: 'right'
                        }
                    });
                } else {
                    if (jsonResponse.error) {
                        $.notify({
                            icon: "add_alert",
                            message: jsonResponse.error
                        }, {
                            type: 'danger',
                            timer: 3000,
                            placement: {
                                from: 'top',
                                align: 'right'
                            }
                        });
                    }
                }
            },
            error: function (request) {
                if (request.responseText) {
                    $.notify({
                        icon: "add_alert",
                        message: request.responseText
                    }, {
                        type: 'danger',
                        timer: 3000,
                        placement: {
                            from: 'top',
                            align: 'right'
                        }
                    });
                }
                console.error(request);
            }
        });
    }

    this.initExistingFilters = function (idRoot, id) {
        $.ajax({
            url: global.api_url + 'steps/' + id + "/qa/get_elasticsearch_filters",
            type: 'GET',
            dataType: 'json',
            data: {
                idRoot: idRoot
            },
            success: function (jsonResponse) {

                if (jsonResponse.success === true && jsonResponse.filters) {
                    let filters = JSON.parse(jsonResponse.filters);
                    elasticFilters = filters.filters;
                    activeElasticFilters = filters.active;
                    if (filters.selectedMetadata) {
                        selectedMetadata = filters.selectedMetadata;
                    }
                } else {
                    if (jsonResponse.error) {
                        $.notify({
                            icon: "add_alert",
                            message: jsonResponse.error
                        }, {
                            type: 'danger',
                            timer: 3000,
                            placement: {
                                from: 'top',
                                align: 'right'
                            }
                        });
                    }

                    elasticFilters = {};
                    activeElasticFilters = [];
                }
            },
            error: function (request) {

                if (request.responseText) {
                    $.notify({
                        icon: "add_alert",
                        message: request.responseText
                    }, {
                        type: 'danger',
                        timer: 3000,
                        placement: {
                            from: 'top',
                            align: 'right'
                        }
                    });
                }
                console.error(request);

                elasticFilters = {};
                activeElasticFilters = [];
            }
        });
    }

    this.editFilterLogic = function (ref) {
        container = $(ref);
        let filter_id = $(ref).attr("filter_id");
        let that = this;
        let editFilter = $(ref).popover({
            html: true,
            sanitize: false,
            content: function () {
                let html = "";
                html += '<div class="col-md-12" style="height: 500px; display: inline-flex; flex-direction: column; justify-content: space-around;">';

                html += '   <div class="row" style="justify-content: center; align-items: center;">'
                html += '       <label class="form-check-label" style="width: 120px !important;">';
                html += '           <span style="color: #555;">Filter Name</span>';
                html += '       </label>';
                html += '       <input class="form-check-input filterName" value="' + (filter_id ? filter_id : "") + '" style="width: 50%;position: relative;"/>';
                html += '   </div>'

                html += '   <div class="row" style="justify-content: center; align-items: center;">'
                html += '       <div id="jsoneditor" style="height: 375px; width: 85% !important"></div>';
                html += '   </div>';

                html += '   <div class="row" style="justify-content: center; align-items: center;">'
                html += '       <div style="text-align: center;">';
                html += '           <button type="button" class="btn btn-secondary ' + filter_id + 'CancelFilter">CANCEL</button>';
                html += '           <button type="button" class="btn ' + filter_id + 'TryFilter">INSERT</button>';
                html += '       </div>';
                html += '   </div>';
                html += '</div>';

                return html;
            },
            placement: 'right',
            title: function () {
                let title = '<div style="margin: -15px -15px -5px!important; padding: 15px !important; background: #e7e7e7">Filter Set-up</div>';
                return title;
            },
            container: '#animatedModal',
            trigger: 'click'
        });

        let editor;

        editFilter.off('show.bs.popover');
        editFilter.on('show.bs.popover', function () {
            filter_id = $(ref).attr("filter_id");
            $(".editFilter").each(function () {
                $(this).removeClass("editFilter");
                $(this).popover("hide");
            })

            $($(this).data("bs.popover").tip).addClass("custom-popover-center editFilter");
        });

        editFilter.off('inserted.bs.popover');
        editFilter.on('inserted.bs.popover', function () {
            editor = that.renderJsonFilter(editor, filter_id);
        });

        editFilter.off('shown.bs.popover');
        editFilter.on('shown.bs.popover', function () {

            if ($("#jsoneditor")[0].innerHTML.length == 0) {
                editor = that.renderJsonFilter(editor, filter_id);
            }

            $("." + filter_id + "CancelFilter").off("click");
            $("." + filter_id + "CancelFilter").on("click", function () {
                editFilter.popover('hide');
            });

            $("." + filter_id + "TryFilter").off("click");
            $("." + filter_id + "TryFilter").on("click", function () {

                if (filter_id != null && filter_id != undefined) {
                    delete tmpElasticFilters[filter_id];
                    filter_id = $(".filterName").val().trim();
                    $(ref).attr("filter_id", filter_id);
                } else {
                    filter_id = $(".filterName").val().trim();
                }

                tmpElasticFilters[filter_id] = JSON.stringify(JSON.parse(editor.getText()));

                that.updateExistingFilters()

                $(".editFilter").popover("hide");
                $(".editFilter").removeClass("editFilter");
            });

        });
    }

    this.monitorMetadata = function (ref) {

        container = $(ref);
        let filter_id = $(ref).attr("filter_id");

        let that = this;

        let edit = $(ref).popover({
            html: true,
            sanitize: false,
            content: function () {
                let html = "";
                html += '<div id="selectChip" class="col-md-12" style="height: 500px; justify-content: space-around; overflow: auto;">';

                for (let i = 0; i < metadata.length; i++) {
                    let found = false;

                    for (let j = 0; j < selectedMetadata.length; j++) {
                        if (metadata[i].label == selectedMetadata[j]) {
                            found = true;
                            break;
                        }
                    }

                    if (found) {
                        html += '  <div class="chip selected" style="padding: 10px;">';
                    } else {
                        html += '  <div class="chip" style="padding: 10px;">';
                    }

                    html += '     <div class="chip-head">' + metadata[i].label[0] + '</div>';
                    html += '     <div class="chip-content">' + metadata[i].label + '</div>';
                    html += ' </div>';
                }
                html += '</div>';

                html += '   <div class="row" style="justify-content: center; align-items: center;">'
                html += '       <div style="text-align: center;">';
                html += '           <button type="button" class="btn btn-secondary ' + filter_id + 'CancelFilter">Close</button>';
                html += '       </div>';
                html += '   </div>';

                return html;
            },
            placement: 'right',
            title: function () {
                let title = '<div style="margin: -15px -15px -5px!important; padding: 15px !important; background: #e7e7e7">Select metadata</div>';
                return title;
            },
            container: '#animatedModal',
            trigger: 'click'
        });

        let editor;

        edit.off('show.bs.popover');
        edit.on('show.bs.popover', function () {

            filter_id = $(ref).attr("filter_id");

            $(".editFilter").each(function () {
                $(this).removeClass("editFilter");
                $(this).popover("hide");
            })

            $($(this).data("bs.popover").tip).addClass("custom-popover-scale-center editFilter");

        });

        edit.off('inserted.bs.popover');
        edit.on('inserted.bs.popover', function () {
            //editor = that.renderJsonFilter(editor, filter_id);
        });

        edit.off('shown.bs.popover');
        edit.on('shown.bs.popover', function () {

            /* if ($("#jsoneditor")[0].innerHTML.length == 0) {
                 editor = that.renderJsonFilter(editor, filter_id);
             }*/

            $("." + filter_id + "CancelFilter").off("click");
            $("." + filter_id + "CancelFilter").on("click", function () {
                edit.popover('hide');
            });

            $("." + filter_id + "TryFilter").off("click");
            $("." + filter_id + "TryFilter").on("click", function () {

            });

            $("#selectChip .chip").unbind();
            $("#selectChip .chip").click(function () {
                if ($(this).hasClass("selected")) {
                    $(this).removeClass("selected");

                    let val = $(this).find(".chip-content").text();
                    let index = -1;
                    for (let j = 0; j < selectedMetadata.length; j++) {
                        if (selectedMetadata[j] == val) {
                            index = j;
                            break;
                        }
                    }
                    if (index > -1) {
                        selectedMetadata.splice(index, 1);
                    }
                    $(".count_all_meta").html(selectedMetadata.length);
                } else {
                    $(this).addClass("selected");
                    let val = $(this).find(".chip-content").text();
                    selectedMetadata.push(val);
                }

                $(".count_all_meta").html(selectedMetadata.length);

                if (selectedMetadata.length > 0) {
                    getStatistics = true;
                }
            });

        });
    }

    this.renderJsonFilter = function (editor, filter_id) {
        let json = this.retrieveElasticSearchFilter(filter_id);
        editor = new JSONEditor($("#jsoneditor")[0], { mode: 'code', modes: ['text', 'code'] });
        editor.set(json);
        return editor
    }

    this.updateExistingFilters = function () {
        let html = "";
        let that = this;
        html += '<div id="filterContainer" style="border: 1px black dashed; margin-bottom: 10px; overflow-y: auto; height: 150px;">';
        if (Object.keys(tmpElasticFilters).length > 0) {
            html += '<ul>';
            for (let name in tmpElasticFilters) {
                html += '<li style="display: block;">';
                html += '   <div style="display: flex; justify-content: space-between; align-items: center; margin-right: 10px; margin-top: 2px;">';
                html += '       <div style="padding-top: 10px; width: 200px;">';
                html += '           <input id="' + name + 'FilterCheckbox" type="checkbox"' + (tmpActiveElasticFilters.includes(name) ? " checked" : "") + ' style="float: left; margin-left: -19px; margin-right: 19px; margin-top: 4px; scale: 1.4;" />'
                html += '           <h5 style = "font-weight: bold;">' + name + '</h5>';
                html += '       </div>';
                html += '       <div>';

                html += '           <span style="cursor: pointer;" filter_id="' + name + '" class="filterDelete material-icons" data-original-title="" title="">';
                html += '               delete';
                html += '           </span>';
                html += '           <span style="cursor: pointer;" filter_id="' + name + '" class="filterSettings material-icons" data-original-title="" title="">';
                html += '               settings';
                html += '           </span>';

                html += '       </div>';
                html += '   </div>';
                html += '</li>';
            }
            html += '</ul>';
            html += '</div>';
        } else {
            tmpActiveElasticFilters = []
            tmpElasticFilters = {}
            html += '<div style="color: #aaa7a7; text-align: center; margin-top: 40px;"> Create a filter to start filtering </div>';
        }

        $("#existingFilters").html(html);

        for (let name in tmpElasticFilters) {
            this.editFilterLogic(".filterSettings[filter_id='" + name + "']")

            $("#" + name + "FilterCheckbox").off("change");
            $("#" + name + "FilterCheckbox").on("change", function () {
                if ($(this).is(":checked")) {
                    tmpActiveElasticFilters.push(name)
                } else {

                    let temp_filters = [];
                    for (let idx in tmpActiveElasticFilters) {
                        if (tmpActiveElasticFilters[idx] != name) {
                            temp_filters.push(tmpActiveElasticFilters[idx])
                        }
                    }

                    tmpActiveElasticFilters = temp_filters;
                }
            });
        }

        let deletePop = $(".filterDelete").popover({
            html: true,
            sanitize: false,
            content: function () {

                let htmlDel = '<div style="text-align: center;"><button type="button" class="btn btn-secondary cancelFilterDelete">Cancel</button>';
                htmlDel += '<button type="button" filter_id="' + $(this).attr("filter_id") + '"class="btn btn-warning innerFilterDelete">Delete</button></div>';

                return htmlDel;
            },
            placement: 'top',
            title: function () {
                let title = "Delete Filter?";
                return title;
            },
            container: '#animatedModal',
            trigger: 'click'
        });

        deletePop.off('show.bs.popover');
        deletePop.on('show.bs.popover', function () {
            $($(this).data("bs.popover").tip).addClass("custom-popover-scale");
        });

        deletePop.off('inserted.bs.popover');
        deletePop.on('inserted.bs.popover', function () {

            $(".cancelFilterDelete").off("click");
            $(".cancelFilterDelete").on("click", function () {
                $(".filterDelete").popover("hide");
            });

            $(".innerFilterDelete").off("click");
            $(".innerFilterDelete").on("click", function () {

                let filter_id = $(this).attr("filter_id");
                let tmpJson = JSON.parse(tmpElasticFilters[filter_id]);

                for (let tmp in tmpJson[0].terms) {
                    let key = tmp.split(".");
                    let valTmp = tmpJson[0].terms[tmp][0];
                }

                delete tmpElasticFilters[filter_id];

                let tmpActive = []
                for (let idx in tmpActiveElasticFilters) {
                    if (tmpActiveElasticFilters[idx] != filter_id) {
                        tmpActive.push(tmpActiveElasticFilters[idx])
                    }
                }
                tmpActiveElasticFilters = tmpActive;
                $(".filterDelete").popover("hide");
                that.updateExistingFilters()
            });
        });
    }

    this.retrieveElasticSearchFilter = function (id = undefined) {
        if (id == undefined) {
            if (Object.keys(tmpElasticFilters).length == 0) {
                id = 0
            } else {
                id = Object.keys(tmpElasticFilters).length
            }
            return JSON.parse('[{"query_string":{"fields":["categories_data.namespace"],"query":"INSERT NAMESPACE VALUE HERE"}},{"query_string":{"fields":["extractions_data.fields.name"],"query":"INSERT FIELD NAME VALUE HERE"}}]');
        } else {
            return JSON.parse(tmpElasticFilters[id]);
        }
    }

    this.persistConfig = function (idRoot, id, configuration, prevConfigData = undefined) {
        let that = this;
        let persistData;

        if (configuration == defaultConfigName) {
            persistData = {
                configName: configuration,
                languageParameters: languageParameters,
                packLanguages: packLanguages,
                envParams: this.storeEnvParams()
            }
        } else {
            persistData = {
                configName: configuration,
                languageParameters: languageParameters,
                packLanguages: packLanguages,
                envParams: this.storeEnvParams()
            }
        }

        $.ajax({
            url: global.api_url + 'steps/' + id + "/qa/persist",
            type: 'POST',
            dataType: 'json',
            data: {
                idRoot: idRoot,
                persist: JSON.stringify(persistData)
            },
            success: function (jsonResponse) {

                if (jsonResponse.success === true) {
                    if (!configList.includes(configuration)) {
                        configList.push(configuration);
                        $(".configList").append('<option value="' + configuration + '">' + configuration + ' </option>');
                        that.loadDeleteConfig(idRoot, id);
                    }

                    let forcedStoredConfig = function () {
                        if (prevConfigData) {
                            storedConfigs[prevConfigData.name] = prevConfigData.data;
                        }
                    }

                    $(".configList").val(configuration).trigger("change", { "forcedStoredConfig": forcedStoredConfig });
                } else {
                    if (prevConfigData) {
                        storedConfigs[prevConfigData.name] = prevConfigData.data;
                    }

                    if (jsonResponse.error) {
                        $.notify({
                            icon: "add_alert",
                            message: jsonResponse.error
                        }, {
                            type: 'danger',
                            timer: 3000,
                            placement: {
                                from: 'top',
                                align: 'right'
                            }
                        });
                    }

                    console.error(jsonResponse.error);
                }

            }, error: function (request) {

                if (prevConfigData) {
                    storedConfigs[prevConfigData.name] = prevConfigData.data;
                }

                if (request.responseText) {
                    $.notify({
                        icon: "add_alert",
                        message: request.responseText
                    }, {
                        type: 'danger',
                        timer: 3000,
                        placement: {
                            from: 'top',
                            align: 'right'
                        }
                    });
                }
                console.error(request);
            }
        });
    }

    this.buildQaRequest = function (query, idRoot) {
        let modesTmp = [];
        if (modes == "hybrid") {
            modesTmp.push("elastic");
            modesTmp.push("neural");
        } else if (modes == "elastic") {
            modesTmp.push("elastic");
        } else if (modes == "neural") {
            modesTmp.push("neural");
        } else if (modes == "cross-encoder") {
            modesTmp.push("elastic");
            modesTmp.push("neural");
            modesTmp.push("cross-encoder");
        }

        let filtersTmp = [];
        if (filters == "hybrid") {
            filtersTmp.push("elastic");
            filtersTmp.push("neural");
        } else if (filters == "elastic") {
            filtersTmp.push("elastic");
        } else if (filters == "neural") {
            filtersTmp.push("neural");
        }

        iframe[0].contentWindow.postMessage({
            clear: "highlight"
        }, "*");

        let rangesElastic = {}

        for (let language in languageParameters) {
            rangesElastic[language] = deepCopy(languageParameters[language]["elastic"]);
        }

        let rangesNeural = {}
        for (let language in languageParameters) {
            rangesNeural[language] = deepCopy(languageParameters[language]["neural"]);
        }

        let crossEncoderConf = {}
        for (let language in languageParameters) {
            crossEncoderConf[language] = deepCopy(languageParameters[language]["cross_encoder"]);
            crossEncoderConf[language].evaluated_content = (crossEncoderContent == "content") ? "content" : "embedding_content";
        }

        let elasticFiltersList = [];
        if (enable_filter_button) {
            for (let filterName in elasticFilters) {
                if (activeElasticFilters.includes(filterName)) {
                    let jsonFilter = JSON.parse(elasticFilters[filterName]);
                    if (Array.isArray(jsonFilter)) {
                        for (let idx in jsonFilter) {
                            elasticFiltersList.push(JSON.stringify(jsonFilter[idx]))
                        }
                    } else {
                        elasticFiltersList.push(elasticFilters[filterName])
                    }
                }
            }
        }
       
        let reqData = {
            idRoot: idRoot,
            question: query,
            user: keycloak.tokenParsed.preferred_username,
            params: {
                return_statistics: getStatistics,
                debug: getDebug,
                modes: modesTmp,
                filters: filtersTmp,
                top_k_docs: top_k_docs,
                group_sub_passages: group_sub_passages,
                language_filters: $("#countrySelect").val(),
                elasticsearch_filter: elasticFiltersList
            },
            neural: {
                score_ranges: rangesNeural
            },
            elastic: {
                expand_query: getExpandQuery,
                entity_boost: entity_boost,
                expansion_boost: expansion_boost,
                score_ranges: rangesElastic,
                estimate_elastic_range: !getCustomElasticRanges
            },
            cross_encoder: {
                params: crossEncoderConf,
            }, ui: {
                metadata_template_to_title: metadata_template_to_title
            }
        }

        return reqData
    }

    this.getResourcesPerLang = function (languages) {

        let ret = {};

        for (let l = 0; l < languages.length; l++) {
            ret[languages[l]] = $("#semanticAnalysisModelsMapForIndexing" + capitalize(languages[l])).val();
        }

        return ret
    }

    this.addDocument = function (idRoot) {
        let that = this;
        let engine = $('#engine').val();

        let semanticAnalysisMode = $("#semanticAnalysisMode").val();

        let language = $("#language").val();
        let semanticAnalysisModelsMapForIndexing = this.getResourcesPerLang(language);

        let description = $("#description").val();

        let orderVector = [];

        for (let key in filesUpload) {
            let value = filesUpload[key];
            orderVector.push({
                data: value.data,
                size: value.size,
                name: value.name
            });
        }

        filesUpload = {};

        orderVector.sort(function (a, b) {
            if (a.name < b.name) { return -1; }
            if (a.name > b.name) { return 1; }
            return 0;
        });

        let doDelete = {};
        let toSend = [];
        for (let i = 0; i < orderVector.length; i++) {
            if (orderVector[i].name.includes("-INPUT")) {
                for (let j = (i + 1); j < orderVector.length; j++) {
                    if (orderVector[j].name.includes("-OUTPUT")) {
                        let nameInput = orderVector[i].name.split("-INPUT")[0];
                        let nameOutput = orderVector[j].name.split("-OUTPUT")[0];
                        if (nameInput === nameOutput) {
                            toSend.push({
                                data: orderVector[i].data,
                                dataAnnotation: orderVector[j].data,
                                size: orderVector[i].size,
                                name: nameInput + ".pdf"
                            });
                            doDelete[i] = true;
                            doDelete[j] = true;
                            break;
                        }
                    }
                }
            }
        }

        for (let i = 0; i < orderVector.length; i++) {
            if (!doDelete[i]) {
                toSend.push({
                    data: orderVector[i].data,
                    dataAnnotation: null,
                    size: orderVector[i].size,
                    name: orderVector[i].name
                });
            }
        }

        for (let i = 0; i < toSend.length; i++) {

            for (let key in filesUploadJson) {
                let value = filesUploadJson[key];
                if (value.name.toLowerCase().split(".json")[0] === toSend[i].name.toLowerCase().split(".pdf")[0]) {
                    toSend[i].dataJson = value.data;
                    break;
                }
            }
        }


        if (toSend.length == 0) {
            $.notify({
                icon: "add_alert",
                message: "Insert a PDF file!"
            }, {
                type: 'danger',
                timer: 3000,
                placement: {
                    from: 'top',
                    align: 'right'
                }
            });
            return false;
        }

        let vars = {
            documents: toSend,
            segmentationStrategy: $("#segmentation").val(),
            semanticAnalysisModelsMapForIndexing: semanticAnalysisModelsMapForIndexing,
            engine: engine,
            languages: language,
            description: description,
            doubleColumn: $("#doubleColumn").prop('checked'),
            ocr: $("#ocr").prop('checked'),
            indexStrategies: $("#indexSegmentation").val().split(", "),
            idRoot: idRoot,
            enableQa: $(".enableQa").prop('checked')
        };

        if (semanticAnalysisMode){
            vars['semanticAnalysisMode'] = semanticAnalysisMode;
        }

        let rootFiles = $("#rootFiles");
        rootFiles.show();
        $("#tableContainer").hide();
        rootFiles.html(loadingHTML);
        $("#semanticAnalysisModelsMapForIndexing").select2("destroy");

        $.ajax({
            url: global.api_url + '/steps/start',
            type: 'POST',
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify(vars),
            success: function (jsonResponse) {
                console.log("Server start steps response -->", jsonResponse);
                rootFiles.html("");
                that.tables(idRoot);
            }, error: function (request) {
                rootFiles.html("");
                that.tables(idRoot);
                if (request.responseText) {
                    $.notify({
                        icon: "add_alert",
                        message: request.responseText
                    }, {
                        type: 'danger',
                        timer: 3000,
                        placement: {
                            from: 'top',
                            align: 'right'
                        }
                    });
                }
                console.error(request);
            }
        });
    }

    this.initFolders = function () {
        let that = this;
        $(".root").click(function () {
            that.readRoot();
        });
    }

    this.readRoot = function () {
        $("#switchVisualization, #addRootFolderBTN").show();
        let rootFiles = $("#rootFiles");
        rootFiles.show();
        $("#rootFilesTable").hide();

        $("#tableContainer").hide();
        rootFiles.html(loadingHTML);

        let breadcrumb = $("#breadcrumb");

        if (breadcrumb.find("li").length == 2) {
            breadcrumb.find("li").last().remove();
        }

        let that = this;
        $.ajax({
            url: global.api_url + '/steps/root',
            type: 'GET',
            data: {
                user: keycloak.tokenParsed.preferred_username
            },
            dataType: 'json',
            contentType: 'application/json',
            success: function (data) {
                console.log(data);
                that.makeFolderRoot(data);
            },
            error: function (request) {
                if (request.responseText) {
                    $.notify({
                        icon: "add_alert",
                        message: request.responseText
                    }, {
                        type: 'danger',
                        timer: 3000,
                        z_index: 2000,
                        placement: {
                            from: 'top',
                            align: 'right'
                        }
                    });
                }
                console.error(request);
            }
        });
    }

    this.makeFolderRoot = function (json) {
        let that = this;
        let breadcrumb = $("#breadcrumb");
        let rootFiles = $("#rootFiles");
        let rootFilesTable = $("#rootFilesTable");

        if (visualizationType == 1) {
            $("#rootFiles").hide();
            $("#rootFilesTable").show();
        } else {
            $("#rootFiles").show();
            $("#rootFilesTable").hide();
        }

        $("#tableContainer").hide();

        if (json.length == 0) {
            rootFiles.html("No documents found!");
            rootFilesTable.html("No documents found!");
        } else {
            rootFiles.html("");
            rootFilesTable.html("");
            let table = '<table id="rootTable" class="table">';
            table += '     <thead class="text-warning">';
            table += '        <tr style="text-align: center;">';
            table += '           <th>Name</th>';
            table += '           <th>Create Date</th>';
            table += '           <th>Modify Date</th>';
            table += '           <th>Action</th>';
            table += '        </tr>';
            table += '     </thead>';
            table += '     <tbody id="rootTableBody">';
            table += '     </tbody>';
            table += '   </table>';
            rootFilesTable.html(table);

            json.sort(function (a, b) {
                if (a.id < b.id) { return -1; }
                if (a.id > b.id) { return 1; }
                return 0;
            });

            for (let i = 0; i < json.length; i++) {
                let html = '';
                if (json[i].id[0] == ".") {
                } else {
                    html = '<div class="file-item" index="' + i + '">';
                    html += '  <div class="file-item-select-bg bg-primary"></div>';
                    html += '   <label class="file-item-checkbox custom-control" style="left: 5px; padding: 0; font-size: 10px;">';
                    html += moment(json[i].date_creation, 'YYYY-M-DTh:m:s A').format('DD/MM/YYYY');
                    html += '     </label>';
                    html += '     <div class="clickRoot file-item-icon fa fa-folder-o text-secondary"></div>';
                    html += '     <a href="javascript:void(0)" class="clickRoot file-item-name">';
                    html += json[i].id;
                    html += '     </a>';

                    let other = "";

                    if (json[i].owner === "" || keycloak.tokenParsed.preferred_username === json[i].owner) {
                        html += '     <div class="file-item-actions btn-group">';
                        html += '         <button type="button" class="btn btn-default btn-sm rounded-pill icon-btn borderless md-btn-flat hide-arrow dropdown-toggle" data-toggle="dropdown"><i class="ion ion-ios-more"></i></button>';
                        html += '         <div class="dropdown-menu dropdown-menu-right">';
                        html += '            <a class="dropdown-item renameRoot" href="javascript:void(0)">Rename</a>';
                        html += '            <a class="dropdown-item deleteRoot" href="javascript:void(0)">Delete</a>';
                        html += '            <a class="dropdown-item userRoot" href="javascript:void(0)">Share</a>';
                        html += '         </div>';
                        html += '     </div>';

                        other = '<span class="material-icons renameRootTable" style="cursor: pointer;">edit</span><span class="material-icons deleteRootTable" style="cursor: pointer;">delete</span><span class="material-icons userRootTable" style="cursor: pointer;">share</span>'
                    }
                    html += '</div>';

                    let htmlSort = '<span style="position: absolute; top: 24px; right: 88px; z-index: 10;"><span style="left: 6px;"  class="btn-group">';
                    htmlSort += '         <button  style="background-color: transparent !important; box-shadow: none !important; padding: 0; margin: none;" type="button" class="btn btn-default btn-sm rounded-pill icon-btn borderless md-btn-flat hide-arrow dropdown-toggle" data-toggle="dropdown"><i class="fa fa-sort fa-2x" aria-hidden="true"></i><i class="ion ion-ios-more"></i></button>';
                    htmlSort += '         <div class="dropdown-menu dropdown-menu-right">';
                    htmlSort += '            <a class="dropdown-item sortABC" href="javascript:void(0)" style="text-decoration:underline"><b>By Name</b></a>';
                    htmlSort += '            <a class="dropdown-item sortDate" href="javascript:void(0)">By Date</a>';
                    htmlSort += '         </div>';
                    htmlSort += '     </span></span>';

                    html = htmlSort + html;
                    rootFiles.append(html);

                    //Table
                    let htmlTable = '<tr index="' + i + '"><td>' + json[i].id + '</td><td>' + moment(json[i].date_creation, 'YYYY-M-DTh:m:s A').format('DD/MM/YYYY') + '</td><td>' + moment(json[i].date_modify, 'YYYY-M-DTh:m:s A').format('DD/MM/YYYY') + '</td><td><span class="material-icons clickRootTable" style="cursor: pointer;">remove_red_eye</span>' + other + '</td></tr>';
                    $("#rootTableBody").append(htmlTable);
                }
            }

            $("body").off("click", ".sortDate");
            $("body").on("click", ".sortDate", function () {
                rootFiles.html("");
                json.sort(function (a, b) {
                    let dateA = moment(a.date_creation, 'YYYY-M-D');
                    let dateB = moment(b.date_creation, 'YYYY-M-D');

                    return dateB.diff(dateA);
                });

                for (let i = 0; i < json.length; i++) {
                    let html = '';
                    if (json[i].id[0] == ".") {
                    } else {
                        html = '<div class="file-item" index="' + i + '">';
                        html += '  <div class="file-item-select-bg bg-primary"></div>';
                        html += '   <label class="file-item-checkbox custom-control" style="left: 5px; padding: 0; font-size: 10px;">';
                        html += moment(json[i].date_creation, 'YYYY-M-DTh:m:s A').format('DD/MM/YYYY');
                        html += '     </label>';
                        html += '     <div class="clickRoot file-item-icon fa fa-folder-o text-secondary"></div>';
                        html += '     <a href="javascript:void(0)" class="clickRoot file-item-name">';
                        html += json[i].id;
                        html += '     </a>';

                        let other = "";

                        if (json[i].owner === "" || keycloak.tokenParsed.preferred_username === json[i].owner) {
                            html += '     <div class="file-item-actions btn-group">';
                            html += '         <button type="button" class="btn btn-default btn-sm rounded-pill icon-btn borderless md-btn-flat hide-arrow dropdown-toggle" data-toggle="dropdown"><i class="ion ion-ios-more"></i></button>';
                            html += '         <div class="dropdown-menu dropdown-menu-right">';
                            html += '            <a class="dropdown-item renameRoot" href="javascript:void(0)">Rename</a>';
                            html += '            <a class="dropdown-item deleteRoot" href="javascript:void(0)">Delete</a>';
                            html += '            <a class="dropdown-item userRoot" href="javascript:void(0)">Share</a>';
                            html += '         </div>';
                            html += '     </div>';

                            other = '<span class="material-icons renameRootTable" style="cursor: pointer;">edit</span><span class="material-icons deleteRootTable" style="cursor: pointer;">delete</span><span class="material-icons userRootTable" style="cursor: pointer;">share</span>'
                        }
                        html += '</div>';

                        let htmlSort = '<span style="position: absolute; top: 24px; right: 88px; z-index: 10;"><span style="left: 6px;"  class="btn-group">';
                        htmlSort += '         <button  style="background-color: transparent !important; box-shadow: none !important; padding: 0; margin: none;" type="button" class="btn btn-default btn-sm rounded-pill icon-btn borderless md-btn-flat hide-arrow dropdown-toggle" data-toggle="dropdown"><i class="fa fa-sort fa-2x" aria-hidden="true"></i><i class="ion ion-ios-more"></i></button>';
                        htmlSort += '         <div class="dropdown-menu dropdown-menu-right">';
                        htmlSort += '            <a class="dropdown-item sortABC" href="javascript:void(0)">By Name</a>';
                        htmlSort += '            <a class="dropdown-item sortDate" href="javascript:void(0)" style="text-decoration:underline"><b>By Date</b></a>';
                        htmlSort += '         </div>';
                        htmlSort += '     </span></span>';

                        html = htmlSort + html;
                        rootFiles.append(html);

                    }
                }
            });

            $("body").off("click", ".sortABC");
            $("body").on("click", ".sortABC", function () {
                rootFiles.html("");
                json.sort(function (a, b) {
                    if (a.id < b.id) { return -1; }
                    if (a.id > b.id) { return 1; }
                    return 0;
                });

                for (let i = 0; i < json.length; i++) {
                    let html = '';
                    if (json[i].id[0] == ".") {
                        //html = '<div class="file-item" style="display:none;">';
                    } else {
                        html = '<div class="file-item" index="' + i + '">';
                        //}
                        html += '  <div class="file-item-select-bg bg-primary"></div>';
                        html += '   <label class="file-item-checkbox custom-control" style="left: 5px; padding: 0; font-size: 10px;">';
                        html += moment(json[i].date_creation, 'YYYY-M-DTh:m:s A').format('DD/MM/YYYY');
                        html += '     </label>';
                        html += '     <div class="clickRoot file-item-icon fa fa-folder-o text-secondary"></div>';
                        html += '     <a href="javascript:void(0)" class="clickRoot file-item-name">';
                        html += json[i].id;
                        html += '     </a>';

                        let other = "";

                        if (json[i].owner === "" || keycloak.tokenParsed.preferred_username === json[i].owner) {
                            html += '     <div class="file-item-actions btn-group">';
                            html += '         <button type="button" class="btn btn-default btn-sm rounded-pill icon-btn borderless md-btn-flat hide-arrow dropdown-toggle" data-toggle="dropdown"><i class="ion ion-ios-more"></i></button>';
                            html += '         <div class="dropdown-menu dropdown-menu-right">';
                            html += '            <a class="dropdown-item renameRoot" href="javascript:void(0)">Rename</a>';
                            html += '            <a class="dropdown-item deleteRoot" href="javascript:void(0)">Delete</a>';
                            html += '            <a class="dropdown-item userRoot" href="javascript:void(0)">Share</a>';
                            html += '         </div>';
                            html += '     </div>';

                            other = '<span class="material-icons renameRootTable" style="cursor: pointer;">edit</span><span class="material-icons deleteRootTable" style="cursor: pointer;">delete</span><span class="material-icons userRootTable" style="cursor: pointer;">share</span>'
                        }
                        html += '</div>';

                        let htmlSort = '<span style="position: absolute; top: 24px; right: 88px; z-index: 10;"><span style="left: 6px;"  class="btn-group">';
                        htmlSort += '         <button  style="background-color: transparent !important; box-shadow: none !important; padding: 0; margin: none;" type="button" class="btn btn-default btn-sm rounded-pill icon-btn borderless md-btn-flat hide-arrow dropdown-toggle" data-toggle="dropdown"><i class="fa fa-sort fa-2x" aria-hidden="true"></i><i class="ion ion-ios-more"></i></button>';
                        htmlSort += '         <div class="dropdown-menu dropdown-menu-right">';
                        htmlSort += '            <a class="dropdown-item sortABC" href="javascript:void(0)" style="text-decoration:underline"><b>By Name</b></a>';
                        htmlSort += '            <a class="dropdown-item sortDate" href="javascript:void(0)">By Date</a>';
                        htmlSort += '         </div>';
                        htmlSort += '     </span></span>';

                        html = htmlSort + html;
                        rootFiles.append(html);

                    }
                }
            });

            $.fn.dataTable.moment('DD/MM/YYYY');
            let tableTmp = $("#rootTable").DataTable({
                responsive: false,
                scrollY: "calc(100vh - 300px)",
                scrollX: "calc(100% - 1px)",
                sScrollXInner: "100%",
                scrollCollapse: false,
                paging: false,
                fixedColumns: false,
                columns: [
                    {
                        orderable: true
                    },
                    {
                        orderable: true,
                        width: "80px"
                    },
                    {
                        orderable: true,
                        width: "80px"
                    },
                    {
                        orderable: false,
                        width: "80px"
                    }
                ],
                fnDrawCallback: function (data, type) {
                    $('input[type="search"]').addClass("form-control");
                }
            });

            tableTmp.columns.adjust().draw();
        }

        $(".userRoot").unbind();
        $(".userRoot").click(function () {
            let id = parseInt($(this).closest(".file-item").attr("index"));
            let filename = $(this).closest(".file-item").find("a.clickRoot").text().trim();
            //console.log(json[id].users);
            that.loadUsers(filename, json[id].users, json[id].usersRegex);
        });

        $("body").off("click", ".userRootTable");
        $("body").on("click", ".userRootTable", function () {
            let id = parseInt($(this).closest("tr").attr("index"));
            let filename = $(this).parent().find("tr").eq(0).text().trim();
            //console.log(json[id].users);
            that.loadUsers(filename, json[id].users, json[id].usersRegex);
        });

        $("body").off("click", ".clickRoot");
        $("body").on("click", ".clickRoot", function () {
            let name = $(this).parent().find("a.clickRoot").text().trim();
            if (breadcrumb.find("li").length == 2) {
                breadcrumb.find("li").last().remove();
            }
            breadcrumb.append("<li class='breadcrumb-item active'>" + name + "</li>");
            rootFiles.hide();
            that.tables(name);
            $("#switchVisualization, #addRootFolderBTN").hide();
        });

        $("body").off("click", ".clickRootTable");
        $("body").on("click", ".clickRootTable", function () {
            let name = $(this).closest("tr").find("td").eq(0).text().trim();
            if (breadcrumb.find("li").length == 2) {
                breadcrumb.find("li").last().remove();
            }
            breadcrumb.append("<li class='breadcrumb-item active'>" + name + "</li>");
            $("#rootFilesTable").hide();
            that.tables(name);
            $("#switchVisualization, #addRootFolderBTN").hide();
        });

        $("#addRootFolderBTN").unbind();
        $("#addRootFolderBTN").click(function () {
            $(".addNewroot").val("");
            $("#newRootModal").modal("show");

            $(".saveRoot").unbind();
            $(".saveRoot").click(function () {
                let filename = $(".addNewroot").val().replace(/([^a-z0-9\s]+)/gi, '-');
                $.ajax({
                    url: global.api_url + 'steps/root',
                    type: 'post',
                    dataType: 'json',
                    data: {
                        idRoot: filename,
                        owner: keycloak.tokenParsed.preferred_username
                    },
                    success: function (jsonResponse) {
                        $("#newRootModal").modal("hide");
                        if (jsonResponse.success) {
                            that.readRoot();
                            $.notify({
                                icon: "add_alert",
                                message: "Folder created!"
                            }, {
                                type: 'success',
                                timer: 3000,
                                placement: {
                                    from: 'top',
                                    align: 'right'
                                }
                            });
                        } else {
                            $.notify({
                                icon: "add_alert",
                                message: "Folder saved error"
                            }, {
                                type: 'danger',
                                timer: 3000,
                                placement: {
                                    from: 'top',
                                    align: 'right'
                                }
                            });
                        }
                    }, error: function (request) {
                        if (request.responseText) {
                            $.notify({
                                icon: "add_alert",
                                message: request.responseText
                            }, {
                                type: 'danger',
                                timer: 3000,
                                placement: {
                                    from: 'top',
                                    align: 'right'
                                }
                            });
                        }
                        console.error(request);
                    }
                });
            });
        });

        $("body").off("click", ".deleteRootTable");
        $("body").on("click", ".deleteRootTable", function () {
            $("#deletRootModal").modal("show");
            let filename = $(this).closest("tr").find("td").eq(0).text().trim();
            $(".deleteRootFolder").unbind();
            $(".deleteRootFolder").click(function () {
                $.ajax({
                    url: global.api_url + 'steps/root',
                    type: 'DELETE',
                    dataType: 'json',
                    data: {
                        idRoot: filename,
                    },
                    success: function (jsonResponse) {
                        $("#deletRootModal").modal("hide");
                        if (jsonResponse.success) {
                            that.readRoot();
                            $.notify({
                                icon: "add_alert",
                                message: "Folder removed!"
                            }, {
                                type: 'success',
                                timer: 3000,
                                placement: {
                                    from: 'top',
                                    align: 'right'
                                }
                            });
                        } else {
                            $.notify({
                                icon: "add_alert",
                                message: "Folder remove error"
                            }, {
                                type: 'danger',
                                timer: 3000,
                                placement: {
                                    from: 'top',
                                    align: 'right'
                                }
                            });
                        }
                    }, error: function (request) {
                        if (request.responseText) {
                            $.notify({
                                icon: "add_alert",
                                message: request.responseText
                            }, {
                                type: 'danger',
                                timer: 3000,
                                placement: {
                                    from: 'top',
                                    align: 'right'
                                }
                            });
                        }
                        console.error(request);
                    }
                });
            });

        });

        $("body").off("click", ".deleteRoot");
        $("body").on("click", ".deleteRoot", function () {
            $("#deletRootModal").modal("show");
            let filename = $(this).closest(".file-item").find("a.clickRoot").text().trim();
            $(".deleteRootFolder").unbind();
            $(".deleteRootFolder").click(function () {
                $.ajax({
                    url: global.api_url + 'steps/root',
                    type: 'DELETE',
                    dataType: 'json',
                    data: {
                        idRoot: filename,
                    },
                    success: function (jsonResponse) {
                        $("#deletRootModal").modal("hide");
                        if (jsonResponse.success) {
                            that.readRoot();
                            $.notify({
                                icon: "add_alert",
                                message: "Folder removed!"
                            }, {
                                type: 'success',
                                timer: 3000,
                                placement: {
                                    from: 'top',
                                    align: 'right'
                                }
                            });
                        } else {
                            $.notify({
                                icon: "add_alert",
                                message: "Folder remove error"
                            }, {
                                type: 'danger',
                                timer: 3000,
                                placement: {
                                    from: 'top',
                                    align: 'right'
                                }
                            });
                        }
                    }, error: function (request) {
                        if (request.responseText) {
                            $.notify({
                                icon: "add_alert",
                                message: request.responseText
                            }, {
                                type: 'danger',
                                timer: 3000,
                                placement: {
                                    from: 'top',
                                    align: 'right'
                                }
                            });
                        }
                        console.error(request);
                    }
                });
            });

        });

        $("body").off("click", ".renameRootTable");
        $("body").on("click", ".renameRootTable", function () {
            $(".filename").val("");
            $("#renameModal").modal("show");
            let oldFilename = $(this).closest("tr").find("td").eq(0).text().trim();

            $(".saveRename").unbind();
            $(".saveRename").click(function () {
                let filename = $(".filename").val().replace(/([^a-z0-9\s]+)/gi, '-');
                $.ajax({
                    url: global.api_url + 'steps/root/rename',
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        idRoot: filename,
                        oldIdRoot: oldFilename
                    },
                    success: function (jsonResponse) {
                        $("#renameModal").modal("hide");
                        if (jsonResponse.success) {
                            that.readRoot();
                            $.notify({
                                icon: "add_alert",
                                message: "Folder changed!"
                            }, {
                                type: 'success',
                                timer: 3000,
                                placement: {
                                    from: 'top',
                                    align: 'right'
                                }
                            });
                        } else {
                            $.notify({
                                icon: "add_alert",
                                message: "Error rename folder!"
                            }, {
                                type: 'danger',
                                timer: 3000,
                                placement: {
                                    from: 'top',
                                    align: 'right'
                                }
                            });
                        }
                    }, error: function (request) {
                        if (request.responseText) {
                            $.notify({
                                icon: "add_alert",
                                message: request.responseText
                            }, {
                                type: 'danger',
                                timer: 3000,
                                placement: {
                                    from: 'top',
                                    align: 'right'
                                }
                            });
                        }
                        console.error(request);
                    }
                });
            });
        });

        $("body").off("click", ".renameRoot");
        $("body").on("click", ".renameRoot", function () {
            $(".filename").val("");
            $("#renameModal").modal("show");
            let oldFilename = $(this).closest(".file-item").find("a.clickRoot").text().trim();

            $(".saveRename").unbind();
            $(".saveRename").click(function () {
                let filename = $(".filename").val().replace(/([^a-z0-9\s]+)/gi, '-');
                $.ajax({
                    url: global.api_url + 'steps/root/rename',
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        idRoot: filename,
                        oldIdRoot: oldFilename
                    },
                    success: function (jsonResponse) {
                        $("#renameModal").modal("hide");
                        if (jsonResponse.success) {
                            that.readRoot();
                            $.notify({
                                icon: "add_alert",
                                message: "Folder changed!"
                            }, {
                                type: 'success',
                                timer: 3000,
                                placement: {
                                    from: 'top',
                                    align: 'right'
                                }
                            });
                        } else {
                            $.notify({
                                icon: "add_alert",
                                message: "Error rename folder!"
                            }, {
                                type: 'danger',
                                timer: 3000,
                                placement: {
                                    from: 'top',
                                    align: 'right'
                                }
                            });
                        }
                    }, error: function (request) {
                        if (request.responseText) {
                            $.notify({
                                icon: "add_alert",
                                message: request.responseText
                            }, {
                                type: 'danger',
                                timer: 3000,
                                placement: {
                                    from: 'top',
                                    align: 'right'
                                }
                            });
                        }
                        console.error(request);
                    }
                });
            });

        });
    }

    this.storeVirtualCollection = function (idRoot, idDoc, name = null) {

        let multiIndex = []
        let checkboxes;

        if (name) {
            checkboxes = $("[id-column=" + idDoc + "]").find(".enableCollection")
        } else {
            checkboxes = $("[id-column=" + idDoc + "].detailsDocs").find(".enableCollection");
        }

        for (let i = 0; i < checkboxes.length; i++) {
            if ($(checkboxes[i]).is(":checked")) {
                let collectionId = $(checkboxes[i]).closest("tr").attr("id-doc")
                multiIndex.push(collectionId);
            }
        }

        let that = this;

        $.ajax({
            url: global.api_url + '/steps/' + idDoc + '/qa/set_multi_index',
            type: 'POST',
            dataType: 'json',
            data: {
                idRoot: idRoot,
                multiIndex: JSON.stringify(multiIndex),
                name: name
            },
            success: function (response) {
                if (response.errors) {
                    for (let e_idx in response.errors) {
                        $.notify({
                            icon: "add_alert",
                            message: response.errors[e_idx]
                        }, {
                            type: 'success',
                            timer: 3000,
                            placement: {
                                from: 'top',
                                align: 'right'
                            }
                        });
                    }
                }
                $("#addVirtualCollection").modal("hide");
                that.tables(idRoot);

            }, error: function (response) {
                if (response.errors) {
                    for (let e_idx in response.errors) {
                        $.notify({
                            icon: "add_alert",
                            message: response.errors[e_idx]
                        }, {
                            type: 'danger',
                            timer: 3000,
                            placement: {
                                from: 'top',
                                align: 'right'
                            }
                        });
                    }
                }
                $("#addVirtualCollection").modal("hide");
                that.tables(idRoot);
            }
        });
    }

    this.bindModal = function (idRoot, idPage, idDoc) {

        let that = this;
        $(".openModal").unbind();
        $(".openModal").animatedModal({
            animatedIn: 'fadeInRight',
            animatedOut: 'fadeOutRight',
            color: '#fff',
            beforeOpen: function (modal) {

                let accordion = $("div[aria-labelledby]");
                accordion.removeClass("show");
                accordion.find(".dataToInsert").html(loadingHTML);
                let id;
                if (idPage) {
                    id = idPage;

                    that.tables(idRoot);
                } else {
                    id = $(modal).closest("tr").attr("id-column");
                    idDoc = $(modal).closest("tr").attr("id-doc");
                }

                that.info = {
                    idRoot: idRoot,
                    idProject: id
                }

                let children = $(".thumb");
                let index = 0;

                function addClassNextChild() {
                    if (index == children.length) return;
                    children.eq(index++).show().velocity("transition.slideRightIn", { opacity: 1, stagger: 450, defaultDuration: 100 });
                    window.setTimeout(addClassNextChild, 100);
                }

                $(".content-visual-modal").show();
                $(".close-animatedModal").show();
                $("#countrySelect").hide();

                addClassNextChild();
                that.loadDocumentsStep(idRoot, id, idDoc);
            },
            afterClose: function () {
                $(".thumb").hide();
                $(".hiddenEntry").hide();

                //closes all popovers
                $("[aria-describedby]").filter(function () {
                    return $(this).attr("aria-describedby").includes("popover")
                }).popover("hide");

                const queryString = window.location.search;
                const urlParams = new URLSearchParams(queryString);
                const idRootLocal = urlParams.get('idRoot');

                const url = new URL(window.location.href);
                url.searchParams.delete('id');
                url.searchParams.delete('idRoot');
                url.searchParams.delete('idDoc');
                window.history.replaceState(null, null, url);

                $('#settingQa').popover("hide");

            }
        });
    }

    this.tables = function (idRoot) {
        let that = this;
        $("#rootFiles").hide();
        $("#tableContainer").hide();

        this.getSemanticAnalysisResources().then(() => {
            this.initDropzoneDocument(idRoot);
            this.initDropzoneBatchIndexing(idRoot);
        });

        
        $("[data-toggle='popover']").popover('destroy');
        if (dTable != null) {
            dTable.destroy();
        }
        loader.show();

        $.ajax({
            url: global.api_url + 'steps/get/',
            type: 'GET',
            dataType: 'json',
            data: {
                idRoot: idRoot
            },
            success: function (json) {
                console.log("Steps: ", json);

                that.stepsInfo = json.steps;
                noReload = true;
                let infoSteps = {};
                if (json.steps.length == 0) {
                    table.find("#steps").html("");
                    loader.hide();
                    dTable = table.DataTable({
                        responsive: true,
                        scrollY: "calc(100vh - 300px)",
                        scrollX: "calc(100% - 1px)",
                        sScrollXInner: "100%",
                        scrollCollapse: false,
                        paging: false,
                        fixedColumns: false,
                        paging: false,
                        fixedColumns: false,
                        fnDrawCallback: function (data, type) {
                            $('input[type="search"]').addClass("form-control");
                        }
                    });
                    $("#tableContainer").show();
                    $("body").resize();
                } else {
                    let html = "";
                    for (let i = 0; i < json.steps.length; i++) {
                        let obj = json.steps[i];
                        infoSteps[obj.id] = obj;

                        let progressState = {
                            progress: 0,
                            conversion: 0,
                            qa: 0,
                            len: obj.docs.length
                        };

                        computeProgress = function (progressState, obj) {

                            progressState.progress = 0;
                            progressState.conversion = 0;
                            progressState.qa = 0;
                            progressState.len = obj.docs.length;

                            for (let k = 0; k < progressState.len; k++) {

                                if (obj.docs[k].progress >= 80) {
                                    obj.docs[k].progress = 100;
                                } else {
                                    obj.docs[k].progress += Math.floor(obj.docs[k].progress * 0.2)
                                }

                                progressState.progress += obj.docs[k].progress;

                                if (obj.docs[k].conversion) {
                                    progressState.conversion++;
                                }

                                if (obj.docs[k].qa) {
                                    progressState.qa++;
                                }

                            }
                            progressState.progress /= progressState.len;

                            if (obj.collectionType == "structured_data") {
                                progressState.progress = (progressState.qa ? 100 : 0);
                            }

                        }

                        computeProgress(progressState, obj)
                        infoSteps[obj.id].loaded = false;

                        $.ajax({
                            url: global.api_url + "steps/get/" + infoSteps[obj.id].id,
                            type: 'GET',
                            dataType: 'json',
                            data: {
                                idRoot: idRoot
                            },
                            success: function (jsonResponse) {
                                infoSteps[obj.id].docs = jsonResponse;
                                infoSteps[obj.id].loaded = true;

                                let progressState = {
                                    progress: 0,
                                    conversion: 0,
                                    qa: 0,
                                    len: infoSteps[obj.id].docs.length
                                };

                                computeProgress(progressState, infoSteps[obj.id])
                                let column = $("tr[id-column='" + infoSteps[obj.id].id + "']");

                                if (infoSteps[obj.id].multiIndex && infoSteps[obj.id].multiIndex != null) {
                                    column.find("td").eq(2).replaceWith("<td><span class='material-icons openModal' href='#animatedModal' style='color: purple'>task_alt</span></td>");

                                } else {
                                    column.find("td").eq(2).replaceWith("<td><span class='material-icons openModal' href='#animatedModal' style='color:" + (progressState.len !== 0 && progressState.conversion == progressState.len ? 'green' : progressState.conversion >= progressState.len / 2 ? 'orange' : 'grey') + "'>task_alt</span></td>");
                                }

                                if (infoSteps[obj.id].multiIndex && infoSteps[obj.id].multiIndex != null) {
                                    column.find("td").eq(3).replaceWith("<td><span class='material-icons openModal' href='#animatedModal' style='color: purple'>task_alt</span></td>");
                                } else {
                                    column.find("td").eq(3).replaceWith("<td><span class='material-icons openModal' href='#animatedModal' style='color:" + (progressState.len !== 0 && progressState.qa == progressState.len ? 'green' : progressState.qa >= progressState.len / 2 ? 'orange' : 'grey') + "'>task_alt</span></td>");
                                }

                                if (infoSteps[obj.id].multiIndex && infoSteps[obj.id].multiIndex != null) {
                                    column.find("td").eq(4).replaceWith("<td class='openModal' href='#animatedModal'><div class='progress'><div class='progress-bar' role='progressbar' aria-valuenow='0' style='width: 100%; background-color: purple !important;' aria-valuemin='0' aria-valuemax='100'></div></div></td>");
                                } else {
                                    column.find("td").eq(4).replaceWith("<td class='openModal' href='#animatedModal'><div class='progress'><div class='progress-bar' role='progressbar' aria-valuenow='0' style='width: " + progressState.progress + "%;' aria-valuemin='0' aria-valuemax='100'></div></div></td>");
                                }

                                $("#" + obj.id + "_loading").replaceWith(generateTable(obj.id));
                            },
                            error: function (request) {
                                if (request.responseText) {
                                    $.notify({
                                        icon: "add_alert",
                                        message: request.responseText
                                    }, {
                                        type: 'danger',
                                        timer: 3000,
                                        placement: {
                                            from: 'top',
                                            align: 'right'
                                        }
                                    });
                                }
                                console.error(request);
                            }
                        });

                        if (obj.multiIndex && obj.multiIndex != null) {
                            html += "<tr class='virtual' style='text-align: center;' id-column='" + obj.id + "'><td></td><td class='virtualDesc'>" + obj.description + " <i class='fa fa-pencil editDesc' aria-hidden='true'></i></td>";
                            html += "<td><span class='material-icons openModal' href='#animatedModal' style='color: purple'>task_alt</span></td>";
                            html += "<td><span class='material-icons openModal' href='#animatedModal' style='color: purple'>task_alt</span></td>";

                        } else {
                            html += "<tr style='text-align: center;' id-column='" + obj.id + "'><td></td><td>" + obj.description + " <i class='fa fa-pencil editDesc' aria-hidden='true'></i></td>";
                            html += "<td><span class='material-icons openModal' href='#animatedModal' style='color:" + (progressState.len !== 0 && progressState.conversion == progressState.len ? 'green' : progressState.conversion >= progressState.len / 2 ? 'orange' : 'grey') + "'>task_alt</span></td>";
                        }

                        if (obj.multiIndex && obj.multiIndex != null) {
                            html += "<td><span class='material-icons openModal' href='#animatedModal' style='color: purple'>task_alt</span></td>";
                        } else {
                            html += "<td><span class='material-icons openModal' href='#animatedModal' style='color:" + (progressState.len !== 0 && progressState.qa == progressState.len ? 'green' : progressState.qa >= progressState.len / 2 ? 'orange' : 'grey') + "'>task_alt</span></td>";
                        }

                        if (obj.multiIndex && obj.multiIndex != null) {
                            html += "<td class='openModal' href='#animatedModal'><div class='progress'><div class='progress-bar' role='progressbar' aria-valuenow='0' style='width: 100%; background-color: purple !important;' aria-valuemin='0' aria-valuemax='100'></div></div></td>";
                            html += "<td><span class='material-icons openModal hideOnEdit' href='#animatedModal' style='cursor: pointer;'>remove_red_eye</span>";
                            html += "<span class='material-icons editVirtualCollection hideOnEdit' style='cursor: pointer; padding-left: 4px; padding-right: 3.5px;'>check_box</span>";
                            html += "<span class='material-icons saveVirtualCollection showOnEdit' style='cursor: pointer; display:none;'>save</span>";
                            html += "<span class='material-icons cancelEditMode showOnEdit' style='cursor: pointer; display:none;'>cancel</span>";
                            html += "<span class='material-icons deleteModal hideOnEdit' style='cursor: pointer;'>delete</span></td></tr>";
                        } else {
                            html += "<td class='openModal' href='#animatedModal'><div class='progress'><div class='progress-bar' role='progressbar' aria-valuenow='0' style='width: " + progressState.progress + "%;' aria-valuemin='0' aria-valuemax='100'></div></div></td>";
                            html += "<td><span class='material-icons openModal' href='#animatedModal' style='cursor: pointer;'>remove_red_eye</span> <span class='material-icons addFileModal' style='cursor: pointer;'>picture_as_pdf</span> <span class='material-icons deleteModal' style='cursor: pointer;'>delete</span></td></tr>"
                        }
                    }
                    loader.hide();
                    $("#tableContainer").show();
                    table.find("#steps").html(html);
                    that.fillVirtualCreationTable(infoSteps);

                    dTable = table.DataTable({
                        scrollY: "calc(100vh - 300px)",
                        scrollX: "calc(100% - 1px)",
                        sScrollXInner: "100%",
                        scrollCollapse: false,
                        paging: false,
                        fixedColumns: false,
                        order: [[1, "asc"]],
                        columnDefs: [{
                            targets: '_all',
                            createdCell: function (td, cellData, rowData, row, col) {
                                $(td).css('padding', '10px')
                            }
                        }],
                        columns: [
                            {
                                className: 'dt-control',
                                orderable: false,
                                data: null,
                                defaultContent: '',
                                width: "80px"
                            },
                            {
                                orderable: true,
                                className: 'dt-body-left'
                            },
                            {
                                orderable: true,
                                width: "80px"
                            },
                            {
                                orderable: true,
                                width: "80px"
                            },
                            {
                                orderable: false,
                                width: "100px"
                            },
                            {
                                orderable: false,
                                width: "100px"
                            }
                        ],
                        fnDrawCallback: function (data, type) {
                            $('input[type="search"]').addClass("form-control");
                            let htmlAdd = '<div style="max-height: 65vh; text-align: center;">';

                            htmlAdd += '       <div class="row visible" style="width: 100%; margin-left: 0;">';
                            htmlAdd += '           <div class="card-body table-responsive col-md-6" style="margin-top: 20px; padding: 0;">';
                            htmlAdd += '               <div class="dz-message" data-dz-message><span>Add Documents</span></div>';
                            htmlAdd += '               <form class="dropzone" id="addFile">';
                            htmlAdd += '                   <div class="dz-message" data-dz-message><span>Load PDF documents</span></div>';
                            htmlAdd += '               </form>';
                            htmlAdd += '           </div>';
                            htmlAdd += '           <div class="card-body table-responsive jsonInsertTwo col-md-6" style="margin-top: 20px; padding: 0; padding-left: 3px; padding-right: 3px;">';
                            htmlAdd += '               <div class="dz-message" data-dz-message><span>Add JSON Metadata</span></div>';
                            htmlAdd += '               <form class="dropzone" id="addFileJson">';
                            htmlAdd += '                   <div class="dz-message" data-dz-message><span>Load JSON documents</span></div>';
                            htmlAdd += '               </form>';
                            htmlAdd += '           </div>';
                            htmlAdd += '       </div>';

                            htmlAdd += '       <div class="row">';
                            htmlAdd += '           <div class="col-md-11" style="margin-left: 35px; text-align: left;">';
                            htmlAdd += '               <label class="form-check-label" style="display: block; position: relative; width: 100% !important;">';
                            htmlAdd += '                   <span class="form-check-sign">';
                            htmlAdd += '                       <span class="check"></span>';
                            htmlAdd += '                   </span>';
                            htmlAdd += '                   <input class="form-check-input enableFilesModal" type="checkbox" style="margin-top: 2px;">';
                            htmlAdd += '                   <span style="color: #555; margin-left: 25px;">Convert non PDF documents to PDF</span>';
                            htmlAdd += '               </label>';
                            htmlAdd += '           </div>';
                            htmlAdd += '       </div>';

                            htmlAdd += '       <div class="row" style="margin-left: 15px;">';
                            htmlAdd += '           <div class="col-md-6" style="padding-left: 7px; text-align: left;">';
                            htmlAdd += '             <div class="labelAddDoc">PDFBOX OPTIONS:</div>';
                            htmlAdd += '               <input id="doubleColumn" class="form-check-input" type="checkbox" style="margin-left: 0px; margin-right: 4px; margin-top: 2px;">';
                            htmlAdd += '               <span class="form-check-sign">';
                            htmlAdd += '                   <span class="check"></span>';
                            htmlAdd += '               </span>';
                            htmlAdd += '               <span style="color: #555; margin-left: 20px;">Force Double Column</span>';
                            htmlAdd += '   	       </div>';
                            htmlAdd += '       </div>';

                            htmlAdd += '   <button type="button" class="btn btn-secondary cancelAddBtn">Cancel</button>';
                            htmlAdd += '   <button type="button" class="btn btn-warning addFileBtn">Add</button>';
                            htmlAdd += '</div>';

                            let addModal = $('.addFileModal').popover({
                                html: true,
                                sanitize: false,
                                content: function () {
                                    return htmlAdd;
                                },
                                placement: 'top',
                                title: function () {
                                    let title = "Add documents";
                                    return title;
                                },
                                container: 'body',
                                trigger: 'click'
                            });

                            addModal.off('shown.bs.popover');
                            addModal.on('shown.bs.popover', function () {
                                let idDoc = $(this).closest("tr").attr("id-column");

                                let fileInsert = {};
                                let fileInsertJson = {};

                                let acceptedFileOnlyPDF = 'application/pdf';
                                // ACCEPT PDFs
                                let acceptedFileTypes = 'application/pdf, text/html';

                                // TABLES (.xls, .xlsx, .csv)
                                acceptedFileTypes += ',text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

                                // .txt, .doc, .docx
                                acceptedFileTypes += ',text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

                                // .ppt, .pptx
                                acceptedFileTypes += ',application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation'

                                let defaultAcceptedTypes;
                                if ($(".enableFilesModal").prop('checked')) {
                                    defaultAcceptedTypes = acceptedFileTypes;
                                } else {
                                    defaultAcceptedTypes = acceptedFileOnlyPDF;
                                }

                                let dropzoneInt = new Dropzone("#addFile", {
                                    url: "/",
                                    acceptedFiles: defaultAcceptedTypes,
                                    clickable: true,
                                    maxFilesize: 10000,
                                    uploadMultiple: true,
                                    autoProcessQueue: false,
                                    addRemoveLinks: true,
                                    init: function () {

                                    },
                                    accept: function (file, done) {
                                        let reader = new FileReader();
                                        reader.onload = function (event) {
                                            fileInsert[file.upload.uuid] = {
                                                name: file.name,
                                                data: event.target.result.split(",")[1],
                                                size: file.size
                                            };
                                        };
                                        reader.readAsDataURL(file, "UTF-8");

                                        done();
                                    },
                                    removedfile: function (file) {
                                        delete fileInsert[file.upload.uuid];
                                        file.previewElement.remove();
                                    }
                                });

                                $(".enableFilesModal").unbind();
                                $(".enableFilesModal").change(function () {
                                    if ($(".enableFilesModal").prop('checked')) {
                                        dropzoneInt.destroy();
                                        dropzoneInt = new Dropzone("#addFile", {
                                            url: "/",
                                            acceptedFiles: acceptedFileTypes,
                                            clickable: true,
                                            maxFilesize: 10000,
                                            uploadMultiple: true,
                                            autoProcessQueue: false,
                                            addRemoveLinks: true,
                                            init: function () {

                                            },
                                            accept: function (file, done) {
                                                let reader = new FileReader();
                                                reader.onload = function (event) {
                                                    fileInsert[file.upload.uuid] = {
                                                        name: file.name,
                                                        data: event.target.result.split(",")[1],
                                                        size: file.size
                                                    };
                                                };
                                                reader.readAsDataURL(file, "UTF-8");

                                                done();
                                            },
                                            removedfile: function (file) {
                                                delete fileInsert[file.upload.uuid];
                                                file.previewElement.remove();
                                            }
                                        });

                                    } else {
                                        dropzoneInt.destroy();
                                        dropzoneInt = new Dropzone("#addFile", {
                                            url: "/",
                                            acceptedFiles: acceptedFileOnlyPDF,
                                            clickable: true,
                                            maxFilesize: 10000,
                                            uploadMultiple: true,
                                            autoProcessQueue: false,
                                            addRemoveLinks: true,
                                            init: function () {

                                            },
                                            accept: function (file, done) {
                                                let reader = new FileReader();
                                                reader.onload = function (event) {
                                                    fileInsert[file.upload.uuid] = {
                                                        name: file.name,
                                                        data: event.target.result.split(",")[1],
                                                        size: file.size
                                                    };
                                                };
                                                reader.readAsDataURL(file, "UTF-8");

                                                done();
                                            },
                                            removedfile: function (file) {
                                                delete fileInsert[file.upload.uuid];
                                                file.previewElement.remove();
                                            }
                                        });
                                    }
                                });

                                if (infoSteps[idDoc].enableQa) {

                                    let dropzoneIntJson = new Dropzone("#addFileJson", {
                                        url: "/",
                                        acceptedFiles: '.json',
                                        clickable: true,
                                        maxFilesize: 10000,
                                        uploadMultiple: true,
                                        autoProcessQueue: false,
                                        addRemoveLinks: true,
                                        init: function () { },
                                        accept: function (file, done) {
                                            let reader = new FileReader();
                                            reader.onload = function (event) {
                                                fileInsertJson[file.upload.uuid] = {
                                                    name: file.name,
                                                    data: event.target.result.split(",")[1],
                                                    size: file.size
                                                };
                                            };
                                            reader.readAsDataURL(file, "UTF-8");

                                            done();
                                        },
                                        removedfile: function (file) {
                                            delete fileInsertJson[file.upload.uuid];
                                            file.previewElement.remove();
                                        }
                                    });

                                } else {
                                    $(".jsonInsertTwo").remove();
                                }

                                $(".cancelAddBtn").off();
                                $(".cancelAddBtn").on("click", function () {
                                    addModal.popover("hide");
                                });

                                $(".addFileBtn").off();
                                $(".addFileBtn").on("click", function () {

                                    let orderVector = [];

                                    for (let key in fileInsert) {
                                        let value = fileInsert[key];
                                        orderVector.push({
                                            data: value.data,
                                            size: value.size,
                                            name: value.name
                                        });
                                    }

                                    fileInsert = {};

                                    orderVector.sort(function (a, b) {
                                        if (a.name < b.name) { return -1; }
                                        if (a.name > b.name) { return 1; }
                                        return 0;
                                    });

                                    let doDelete = {};
                                    let toSend = [];
                                    for (let i = 0; i < orderVector.length; i++) {
                                        if (orderVector[i].name.includes("-INPUT")) {
                                            for (let j = (i + 1); j < orderVector.length; j++) {
                                                if (orderVector[j].name.includes("-OUTPUT")) {
                                                    let nameInput = orderVector[i].name.split("-INPUT")[0];
                                                    let nameOutput = orderVector[j].name.split("-OUTPUT")[0];
                                                    if (nameInput === nameOutput) {
                                                        toSend.push({
                                                            data: orderVector[i].data,
                                                            dataAnnotation: orderVector[j].data,
                                                            size: orderVector[i].size,
                                                            name: nameInput + ".pdf"
                                                        });
                                                        doDelete[i] = true;
                                                        doDelete[j] = true;
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    for (let i = 0; i < orderVector.length; i++) {
                                        if (!doDelete[i]) {
                                            toSend.push({
                                                data: orderVector[i].data,
                                                dataAnnotation: null,
                                                size: orderVector[i].size,
                                                name: orderVector[i].name
                                            });
                                        }
                                    }

                                    for (let i = 0; i < toSend.length; i++) {
                                        for (let key in fileInsertXml) {
                                            let value = fileInsertXml[key];
                                            if (value.name.toLowerCase().split(".xml")[0] === toSend[i].name.toLowerCase().split(".pdf")[0]) {
                                                toSend[i].dataXml = value.data;
                                                break;
                                            }
                                        }

                                        for (let key in fileInsertJson) {
                                            let value = fileInsertJson[key];
                                            if (value.name.toLowerCase().split(".json")[0] === toSend[i].name.toLowerCase().split(".pdf")[0]) {
                                                toSend[i].dataJson = value.data;
                                                break;
                                            }
                                        }
                                    }

                                    if (toSend.length == 0) {
                                        $.notify({
                                            icon: "add_alert",
                                            message: "Insert a PDF file!"
                                        }, {
                                            type: 'danger',
                                            timer: 3000,
                                            placement: {
                                                from: 'top',
                                                align: 'right'
                                            }
                                        });
                                        return false;
                                    }

                                    let vars = {
                                        documents: toSend,
                                        idRoot: idRoot,
                                        ocr: $("#ocr").prop('checked'),
                                        doubleColumn: $("#doubleColumn").prop('checked')
                                    };

                                    $.ajax({
                                        url: global.api_url + 'steps/start/' + idDoc,
                                        type: 'POST',
                                        dataType: 'json',
                                        contentType: 'application/json',
                                        data: JSON.stringify(vars),
                                        success: function (jsonResponse) {
                                            console.log("Server start steps response -->", jsonResponse);
                                            addModal.popover("hide");
                                            that.tables(idRoot);
                                        }, error: function (request) {
                                            if (request.responseText) {
                                                $.notify({
                                                    icon: "add_alert",
                                                    message: request.responseText
                                                }, {
                                                    type: 'danger',
                                                    timer: 3000,
                                                    placement: {
                                                        from: 'top',
                                                        align: 'right'
                                                    }
                                                });
                                            }
                                            console.error(request);
                                        }
                                    });
                                });
                            });

                            let htmlDel = '<div style="text-align: center;"><button type="button" class="btn btn-secondary cancelDelete">Cancel</button>';
                            htmlDel += '<button type="button" class="btn btn-warning delete">Delete</button></div>';

                            let deleteP = $('.deleteModal').popover({
                                html: true,
                                sanitize: false,
                                content: function () {
                                    return htmlDel;
                                },
                                placement: 'top',
                                title: function () {
                                    let title = "Delete all documents?";
                                    return title;
                                },
                                container: 'body',
                                trigger: 'click'
                            });

                            deleteP.off('shown.bs.popover');
                            deleteP.on('shown.bs.popover', function () {
                                let idDoc = $(this).closest("tr").attr("id-column");
                                $(".cancelDelete").off();
                                $(".cancelDelete").on("click", function () {
                                    deleteP.popover("hide");
                                });

                                $(".delete").off();
                                $(".delete").on("click", function () {
                                    deleteP.popover("hide");
                                    $.ajax({
                                        url: global.api_url + 'steps/' + idDoc,
                                        type: 'DELETE',
                                        dataType: 'json',
                                        timeout: 0,
                                        data: {
                                            idRoot: idRoot
                                        },
                                        success: function (data) {
                                            setTimeout(function () {
                                                deleteP.popover("hide");
                                                that.tables(idRoot);
                                            }, 200);
                                        },
                                        error: function (request) {
                                            if (request.responseText) {
                                                $.notify({
                                                    icon: "add_alert",
                                                    message: request.responseText
                                                }, {
                                                    type: 'danger',
                                                    timer: 3000,
                                                    z_index: 2000,
                                                    placement: {
                                                        from: 'top',
                                                        align: 'right'
                                                    }
                                                });
                                            }
                                            console.error(request);
                                        }
                                    });
                                });
                            });

                            let htmlEdit = '<div style="text-align: center;">';
                            htmlEdit += '<div class="form-group"><label class="bmd-label-floating"></label><input id="desc" class="form-control" type="text" /></div>';
                            htmlEdit += '</div><div style="text-align: center;"><button type="button" class="btn btn-secondary cancelEdit">Cancel</button>';
                            htmlEdit += '<button type="button" class="btn btn-warning editValue">Edit</button></div>';

                            let editP = $('.editDesc').popover({
                                html: true,
                                sanitize: false,
                                content: function () {
                                    return htmlEdit;
                                },
                                placement: 'top',
                                title: function () {
                                    return "Edit description";
                                },
                                container: 'body',
                                trigger: 'click'
                            });

                            editP.off('shown.bs.popover');
                            editP.on('shown.bs.popover', function () {
                                let index = $(this).closest("tr").attr("id-column");
                                let data = infoSteps[index];

                                $("#desc").val(data.description);

                                $(".cancelEdit").click(function () {
                                    editP.popover("hide");
                                });

                                $(".editValue").click(function () {
                                    $.ajax({
                                        url: global.api_url + 'steps/' + index,
                                        type: 'POST',
                                        data: {
                                            description: $("#desc").val(),
                                            idRoot: idRoot
                                        },
                                        dataType: 'json',
                                        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
                                        success: function (data) {
                                            setTimeout(function () {
                                                editP.popover("hide");
                                                that.tables(idRoot);
                                            }, 200);
                                        },
                                        error: function (request) {
                                            if (request.responseText) {
                                                $.notify({
                                                    icon: "add_alert",
                                                    message: request.responseText
                                                }, {
                                                    type: 'danger',
                                                    timer: 3000,
                                                    z_index: 2000,
                                                    placement: {
                                                        from: 'top',
                                                        align: 'right'
                                                    }
                                                });
                                            }
                                            console.error(request);
                                        }
                                    });
                                });
                            });

                            let htmlVirtual = '<div style="text-align: center;"><button type="button" class="btn btn-secondary cancelEdit">Cancel</button>';
                            htmlVirtual += '<button type="button" class="btn btn-warning editVirtual">Edit</button></div>';

                            let editVirtualCollection = $(".editVirtualCollection").popover({
                                html: true,
                                sanitize: false,
                                content: function () {
                                    return htmlVirtual;
                                },
                                placement: 'top',
                                title: function () {
                                    let title = "Edit Collection?";
                                    return title;
                                },
                                container: 'body',
                                trigger: 'click'
                            })

                            editVirtualCollection.off('shown.bs.popover');
                            editVirtualCollection.on('shown.bs.popover', function () {
                                let row = $(this).closest("tr");
                                console.log(row)
                                let idDoc = row.attr("id-column");
                                let innerTable = $("[id-column=" + idDoc + "].detailsDocs");

                                row.find(".dt-control").off("click");
                                row.find(".dt-control").on("click", function () {
                                    waitForElement('table[id-column="' + idDoc + '"]').then(
                                        (elem) => {

                                            if ($(".showOnEdit").is(":visible")) {
                                                $(elem).find(".enableCollection").show();
                                            } else {
                                                $(elem).find(".enableCollection").hide();
                                            }
                                        }
                                    )
                                });

                                row.off("change");
                                row.on("change", function () {
                                    if (row.hasClass("shown")) {
                                        $(row).find(".showOnEdit").show();
                                        $(row).find(".hideOnEdit").hide();
                                        innerTable.find(".enableCollection").show();
                                        editCollection(row);
                                    }
                                });

                                editCollection = function (row) {

                                    $(".cancelEditMode").off("click");
                                    $(".cancelEditMode").on("click", function () {
                                        $(".showOnEdit").hide();
                                        $(".hideOnEdit").show();
                                        row.find(".dt-control").trigger("click");
                                    });

                                    let htmlSaveVirtual = '<div style="text-align: center;"><button type="button" class="btn btn-secondary cancelEdit">Cancel</button>';
                                    htmlSaveVirtual += '<button type="button" class="btn btn-warning saveVirtual">Save</button></div>';

                                    let saveVirtualCollection = $(".saveVirtualCollection").popover({
                                        html: true,
                                        sanitize: false,
                                        content: function () {
                                            return htmlSaveVirtual;
                                        },
                                        placement: 'top',
                                        title: function () {
                                            let title = "Update Collection?";
                                            return title;
                                        },
                                        container: 'body',
                                        trigger: 'click'
                                    })

                                    saveVirtualCollection.off('shown.bs.popover');
                                    saveVirtualCollection.on('shown.bs.popover', function () {
                                        $(".cancelEdit").off();
                                        $(".cancelEdit").on("click", function () {
                                            saveVirtualCollection.popover("hide");
                                        });

                                        $(".saveVirtual").off();
                                        $(".saveVirtual").on("click", function () {
                                            saveVirtualCollection.popover("hide");
                                            that.storeVirtualCollection(idRoot, idDoc);
                                        });
                                    });
                                }

                                $(".cancelEdit").off();
                                $(".cancelEdit").on("click", function () {
                                    editVirtualCollection.popover("hide");
                                });

                                $(".editVirtual").off();
                                $(".editVirtual").on("click", function () {
                                    editVirtualCollection.popover("hide");
                                    if (!row.hasClass("shown")) {
                                        row.find(".dt-control").trigger("click");
                                    }
                                    row.trigger("change");

                                });
                            });

                            that.bindModal(idRoot);
                        }
                    });

                    function generateTable(d) {
                        let html = "<table id-column='" + infoSteps[d].id + "' class='detailsDocs' border='0' style='width: 100%; text-align: center; margin: 0 auto;'>";

                        let widthRefs = $("#tableContainer .dataTable>thead>tr>th");

                        if (infoSteps[d].multiIndex && infoSteps[d].multiIndex.length > 0) {

                            html += "<thead class='text-warning'>";
                            html += "   <tr style='text-align: center;'>";
                            html += "      <th style='padding: 10px 18px; width: " + $(widthRefs[0]).width() + "px;'></th>";
                            html += "      <th style='text-align: left; padding: 10px 18px; width: " + $(widthRefs[1]).width() + "px;'>Collection</th>";
                            html += "      <th style='padding: 10px 18px; width: " + $(widthRefs[2]).width() + "px;'></th>";
                            html += "      <th style='padding: 10px 18px; width: " + $(widthRefs[3]).width() + "px;'></th>";
                            html += "      <th style='padding: 10px 18px; width: " + $(widthRefs[4]).width() + "px;'></th>";
                            html += "      <th style='padding: 10px 18px; width: " + $(widthRefs[4]).width() + "px;'>Included</th>";
                            html += "      <th style='padding: 10px 18px; width: " + $(widthRefs[5]).width() + "px;'>Action</th>";

                            html += "    </tr>";
                            html += "</thead>";
                            html += "<tbody>";

                            let includedCollections = infoSteps[d].multiIndex;

                            let counter = 0;
                            let docs = [];

                            for (let idx in infoSteps) {
                                let obj = infoSteps[idx];
                                if (!obj.multiIndex) {
                                    let included = false;
                                    if (includedCollections.includes(idx)) {
                                        included = true;
                                        docs = docs.concat(obj.docs);
                                    }

                                    let includedCheck = ""
                                    includedCheck += '<label class="form-check-label" style="display: block; position: relative; width: 60% !important; margin-left: 2.8em; transform:scale(1.3);">';
                                    includedCheck += '  <span class="form-check-sign">';
                                    includedCheck += '      <span class="check"></span>';
                                    includedCheck += '  </span>';
                                    includedCheck += '  <input class="form-check-input enableCollection" style="accent-color: purple; display:none;" collection="' + infoSteps[d].id + '" ' + (included ? ' checked' : '') + ' type="checkbox">';
                                    includedCheck += '</label>';

                                    html += "<tr style='text-align: center;' id-doc='" + idx + "' id-index='" + counter + "' id-column='" + infoSteps[d].id + "'>"
                                    html += "<td style='padding: 10px;'></td>";
                                    html += "<td style='padding: 10px; text-align: left;'>" + obj.description + "</td>";
                                    html += "<td style='padding: 10px;'></td><td style='padding: 10px;'></td>";
                                    html += "<td style='padding: 10px;'></td><td style='padding: 10px;'></td>";
                                    html += "<td style='padding: 10px;'><span class='material-icons' style='color:" + (included ? 'purple' : 'grey') + "'>task_alt</span></td>"
                                    html += "<td style='padding: 10px;'>" + includedCheck + "</td></tr>";

                                    counter += 1;
                                }
                            }

                            infoSteps[d].docs = docs;

                            html += "</tbody>";
                            html += "</table>";
                        }
                        else {

                            html += "<thead class='text-warning'>";
                            html += "   <tr style='text-align: center;'>";
                            html += "      <th style='padding: 10px 18px; width: " + $(widthRefs[0]).width() + "px;'></th>";
                            html += "      <th style='text-align: left; padding: 10px 18px; width: " + $(widthRefs[1]).width() + "px;'>Filename</th>";
                            html += "      <th style='padding: 10px 18px; width: " + $(widthRefs[2]).width() + "px;'>Convert</th>";
                            html += "      <th style='padding: 10px 18px; width: " + $(widthRefs[3]).width() + "px;'>QA</th>";
                            html += "      <th style='padding: 10px 18px; width: " + $(widthRefs[4]).width() + "px;'>Progress</th>";
                            html += "      <th style='padding: 10px 18px; width: " + $(widthRefs[5]).width() + "px;'>Action</th>";

                            html += "    </tr>";
                            html += "</thead>";
                            html += "<tbody>";

                            for (let i = 0; i < infoSteps[d].docs.length; i++) {
                                let obj = infoSteps[d].docs[i];

                                html += "<tr style='text-align: center;' id-doc='" + obj.id + "' id-index='" + i + "' id-column='" + infoSteps[d].id + "'><td style='padding: 10px;'></td><td style='padding: 10px; text-align: left;'>" + (obj.fileName != null ? obj.fileName : "") + "</td>";

                                if (infoSteps[d].collectionType == "structured_data") {
                                    obj.progress = (obj.qa ? 100 : 0);

                                    html += "<td style='padding: 10px;'><span class='material-icons'> - </span></td>";
                                    html += "<td style='padding: 10px;'><span class='material-icons'  style='color:" + (obj.qa ? 'green' : 'grey') + "'>task_alt</span>" + (obj.qa || allRenew ? renew : '') + "<!--<i class='fa fa-info-circle' aria-hidden='true'></i>--></td>";
                                    html += "<td style='padding: 10px;'><div class='progress'><div class='progress-bar' role='progressbar' aria-valuenow='0' style='width: " + obj.progress + "%;' aria-valuemin='0' aria-valuemax='100'></div></div></td>";
                                }
                                else {
                                    html += "<td style='padding: 10px;'><span class='material-icons' style='color:" + (obj.conversion ? 'green' : 'grey') + "'>task_alt</span>" + (obj.conversion || allRenew ? renew : '') + "<i class='fa fa-info-circle infos infoconv' aria-hidden='true'></i></td>";
                                    html += "<td style='padding: 10px;'><span class='material-icons'  style='color:" + (obj.qa ? 'green' : 'grey') + "'>task_alt</span>" + (obj.qa || allRenew ? renew : '') + "<!--<i class='fa fa-info-circle' aria-hidden='true'></i>--></td>";
                                    html += "<td style='padding: 10px;'><div class='progress'><div class='progress-bar' role='progressbar' aria-valuenow='0' style='width: " + obj.progress + "%;' aria-valuemin='0' aria-valuemax='100'></div></div></td>";
                                }

                                html += "<td style='padding: 10px;'> <span class='material-icons openModal' href='#animatedModal' style='cursor: pointer;'>remove_red_eye</span>  <span class='material-icons deleteModalDoc' style='cursor: pointer;'>delete</span></td></tr>"

                            }

                            html += "</tbody>";
                            html += "</table>";

                        }

                        // `d` is the original data object for the row
                        return (
                            html
                        );
                    }

                    let dataDocs = {};
                    function format(d) {
                        dataDocs[infoSteps[d].id] = infoSteps[d];
                        let idTmp = infoSteps[d].id + "_loading";
                        if (!dataDocs[infoSteps[d].id].loaded && infoSteps[d].multiIndex == null) {

                            let out = '<div class="lds-facebook" id="' + idTmp + '" style="margin-top: 10px;">';
                            out += '<div></div>';
                            out += ' <div></div>';
                            out += ' <div></div>';
                            out += '</div>';
                            return out;
                        } else {
                            return generateTable(d);
                        }

                    }

                    $('#stepsTable tbody').off('click', 'td.dt-control');
                    $('#stepsTable tbody').on('click', 'td.dt-control', function () {
                        let tr = $(this).closest('tr');
                        let row = dTable.row(tr);
                        let index = $(this).closest("tr").attr("id-column");

                        if (row.child.isShown()) {
                            // This row is already open - close it
                            row.child.hide();
                            tr.removeClass('shown');
                        } else {
                            // Open this row
                            row.child(format(index)).show();
                            tr.addClass('shown');

                            let htmlInfoDesc = '<div style="height:60px">';
                            htmlInfoDesc += '<p id="infoDesc"></p>';
                            htmlInfoDesc += '</div>';

                            let descInf = $('.allDescr').popover({
                                html: true,
                                sanitize: false,
                                content: function () {
                                    return htmlInfoDesc;
                                },
                                placement: 'top',
                                title: function () {
                                    return "";
                                },
                                container: 'body',
                                trigger: 'hover'
                            });
                            descInf.off('shown.bs.popover');
                            descInf.on('shown.bs.popover', function () {
                                let index = parseInt($(this).closest("tr").attr("id-index"));
                                let indexDoc = $(this).closest("table").attr("id-column");
                                let data = dataDocs[indexDoc].docs[index];

                                $("#infoDesc").html(data.name);
                            });

                            let htmlInfoConvert = '<div style="height:150px">';
                            htmlInfoConvert += '<p id="infoDet"></p>';
                            htmlInfoConvert += '</div>';

                            let convInf = $('.infoconv').popover({
                                html: true,
                                sanitize: false,
                                content: function () {
                                    return htmlInfoConvert;
                                },
                                placement: 'top',
                                title: function () {
                                    return "Info Conversion";
                                },
                                container: 'body',
                                trigger: 'hover'
                            });

                            convInf.off('shown.bs.popover');
                            convInf.on('shown.bs.popover', function () {
                                let index = parseInt($(this).closest("tr").attr("id-index"));
                                let indexDoc = $(this).closest("table").attr("id-column");
                                let data = dataDocs[indexDoc].docs[index];

                                let des = "Id: " + data.id + "<br/>Filename: " + data.fileName + "</br>Pages: " + data.numPages + "</br>Size: " + data.size + " byte";
                                des += "<br/>" + 'Processing Time: ' + data.conversionTime + " ms";
                                $("#infoDet").html(des);
                            });

                            $("input[type='search'], select[name='stepsTable_length']").addClass("form-control");

                            let htmlDel = '<div style="text-align: center;"><button type="button" class="btn btn-secondary cancelDeleteInt">Cancel</button>';
                            htmlDel += '<button type="button" class="btn btn-warning deleteSingleDoc">Delete</button></div>';

                            let deleteP = $('.deleteModalDoc').popover({
                                html: true,
                                sanitize: false,
                                content: function () {
                                    return htmlDel;
                                },
                                placement: 'top',
                                title: function () {
                                    let title = "Delete document?";
                                    return title;
                                },
                                container: 'body',
                                trigger: 'click'
                            });

                            deleteP.off('shown.bs.popover');
                            deleteP.on('shown.bs.popover', function () {
                                let index = parseInt($(this).closest("tr").attr("id-index"));
                                let indexDoc = $(this).closest("table").attr("id-column");
                                let data = dataDocs[indexDoc].docs[index];
                                $(".cancelDeleteInt").off();
                                $(".cancelDeleteInt").on("click", function () {
                                    deleteP.popover("hide");
                                });

                                $(".deleteSingleDoc").off();
                                $(".deleteSingleDoc").on("click", function () {
                                    deleteP.popover("hide");
                                    $.ajax({
                                        url: global.api_url + 'steps/' + indexDoc + "/" + data.id,
                                        type: 'DELETE',
                                        dataType: 'json',
                                        timeout: 0,
                                        data: {
                                            idRoot: idRoot
                                        },
                                        success: function (data) {
                                            setTimeout(function () {
                                                deleteP.popover("hide");
                                                that.tables(idRoot);
                                            }, 200);
                                        },
                                        error: function (request) {
                                            if (request.responseText) {
                                                $.notify({
                                                    icon: "add_alert",
                                                    message: request.responseText
                                                }, {
                                                    type: 'danger',
                                                    timer: 3000,
                                                    z_index: 2000,
                                                    placement: {
                                                        from: 'top',
                                                        align: 'right'
                                                    }
                                                });
                                            }
                                            console.error(request);
                                        }
                                    });
                                });
                            });

                            let restart = '<div class="controlReinit" style="text-align: center;"><button type="button" class="btn btn-secondary cancelRestart">Cancel</button>';
                            restart += '<button type="button" class="btn btn-warning restart">Re-start</button></div>';

                            restart += '<div class="lds-facebook" id="loaderReinit" style="display: none;">';
                            restart += '   <div></div>';
                            restart += '   <div></div>';
                            restart += '   <div></div>';
                            restart += '</div>';

                            let restartB = $('.renew').popover({
                                html: true,
                                sanitize: false,
                                content: function () {
                                    return restart;
                                },
                                placement: 'top',
                                title: function () {
                                    let title = "Restart step?";
                                    return title;
                                },
                                container: 'body',
                                trigger: 'click'
                            });

                            restartB.off('shown.bs.popover');
                            restartB.on('shown.bs.popover', function () {
                                let index = parseInt($(this).closest("tr").attr("id-index"));
                                let indexDoc = $(this).closest("table").attr("id-column");
                                let data = dataDocs[indexDoc].docs[index];

                                let step = $(this).closest("td").index() - 2;

                                $(".cancelRestart").off();
                                $(".cancelRestart").on("click", function () {
                                    restartB.popover("hide");
                                });

                                $(".restart").off();
                                $(".restart").on("click", function () {
                                    $(".controlReinit").hide();
                                    $("#loaderReinit").show();
                                    $.ajax({
                                        url: global.api_url + 'steps/start/' + indexDoc + '/' + data.id + "/" + step,
                                        type: 'GET',
                                        dataType: 'json',
                                        data: {
                                            idRoot: idRoot
                                        },
                                        success: function (jsonResponse) {
                                            console.log("Server start step response -->", jsonResponse);
                                            setTimeout(function () {
                                                restartB.popover("hide");
                                                that.tables(idRoot);
                                            }, 200);
                                        }, error: function (request) {
                                            if (request.responseText) {
                                                $.notify({
                                                    icon: "add_alert",
                                                    message: request.responseText
                                                }, {
                                                    type: 'danger',
                                                    timer: 3000,
                                                    placement: {
                                                        from: 'top',
                                                        align: 'right'
                                                    }
                                                });
                                            }
                                            console.error(request);
                                        }
                                    });
                                });
                            });

                            that.bindModal(idRoot);

                        }
                    });
                    $("body").resize();
                }
            },
            error: function (request) {
                if (request.responseText) {
                    $.notify({
                        icon: "add_alert",
                        message: request.responseText
                    }, {
                        type: 'danger',
                        timer: 3000,
                        z_index: 2000,
                        placement: {
                            from: 'top',
                            align: 'right'
                        }
                    });
                }
                console.error(request);
            }
        });
    }

    this.loadUsers = function (idRoot, shared, regex) {
        $(".loaderShare").show();
        $(".loadShare").hide();
        $("#addUserModal").modal('show');
        $("#regex").val(regex);
        let that = this;
        $.ajax({
            url: global.api_url + "steps/users",
            type: 'GET',
            dataType: 'json',
            success: function (jsonResponse) {
                let tmpHTML = '<option value="0"> - </option>';
                for (let i = 0; i < jsonResponse.length; i++) {
                    let found = false;
                    for (let j = 0; j < shared.length; j++) {
                        if (jsonResponse[i].username === shared[j]) {
                            found = true;
                        }
                    }
                    if (!found) {
                        tmpHTML += "<option value='" + jsonResponse[i].username + "'> " + jsonResponse[i].username + " </option>";
                    }
                }
                try {
                    $("#users").select2('destroy');
                } catch {

                }
                $("#users").html(tmpHTML)
                $("#users").select2({ width: '100%', dropdownCssClass: "smallFont", dropdownParent: $('#addUserModal') });
                $('#users').val("0");

                $('#users').off('select2:select');
                $('#users').on('select2:select', function (e) {
                    let data = e.params.data;
                    $(".loaderShare").show();
                    $(".loadShare").hide();

                    $.ajax({
                        url: global.api_url + "steps/root/share",
                        type: 'POST',
                        dataType: 'json',
                        contentType: 'application/json',
                        data: JSON.stringify({
                            "idRoot": idRoot,
                            "users": [data.id]
                        }),
                        success: function (jsonResponse) {
                            if (jsonResponse === true) {
                                $("#users option[value='" + data.id + "']").remove();
                                $('#users').trigger('change');
                                $("#shared").append("<option value='" + data.id + "' selected> " + data.id + " </option>");
                                $('#shared').trigger('change');
                            }
                            $(".loaderShare").hide();
                            $(".loadShare").show();
                        },
                        error: function (request) {
                            if (request.responseText) {
                                $.notify({
                                    icon: "add_alert",
                                    message: request.responseText
                                }, {
                                    type: 'danger',
                                    timer: 3000,
                                    placement: {
                                        from: 'top',
                                        align: 'right'
                                    }
                                });
                            }
                            console.error(request);
                        }
                    });
                });

                tmpHTML = '';
                for (let i = 0; i < shared.length; i++) {
                    tmpHTML += "<option value='" + shared[i] + "' selected> " + shared[i] + " </option>";
                }
                try {
                    $("#shared").select2('destroy');
                } catch {

                }
                $("#shared").html(tmpHTML)
                $("#shared").select2({ width: '100%', dropdownCssClass: "smallFont", dropdownParent: $('#addUserModal') });

                $('#shared').off('select2:unselect');
                $('#shared').on('select2:unselect', function (e) {
                    let data = e.params.data;
                    //console.log(data);
                    $(".loaderShare").show();
                    $(".loadShare").hide();
                    $.ajax({
                        url: global.api_url + "steps/root/share",
                        type: 'DELETE',
                        dataType: 'json',
                        contentType: 'application/json',
                        data: JSON.stringify({
                            "idRoot": idRoot,
                            "users": [data.id]
                        }),
                        success: function (jsonResponse) {
                            if (jsonResponse === true) {
                                $("#shared option[value='" + data.id + "']").remove();
                                $('#shared').trigger('change');
                                $('#shared').select2('close');
                                $("#users").append("<option value='" + data.id + "'>" + data.id + " </option>");
                                $('#users').trigger('change');
                            }
                            $(".loaderShare").hide();
                            $(".loadShare").show();
                        },
                        error: function (request) {
                            if (request.responseText) {
                                $.notify({
                                    icon: "add_alert",
                                    message: request.responseText
                                }, {
                                    type: 'danger',
                                    timer: 3000,
                                    placement: {
                                        from: 'top',
                                        align: 'right'
                                    }
                                });
                            }
                            console.error(request);
                        }
                    });
                });

                $('#regexBtn').off('click');
                $('#regexBtn').on('click', function (e) {
                    $(".loaderShare").show();
                    $(".loadShare").hide();
                    $.ajax({
                        url: global.api_url + "steps/root/regex",
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            idRoot: idRoot,
                            regex: $("#regex").val()
                        },
                        success: function (jsonResponse) {
                            if (jsonResponse === true) {
                                $.notify({
                                    icon: "add_alert",
                                    message: "Regex saved!"
                                }, {
                                    type: 'success',
                                    timer: 3000,
                                    placement: {
                                        from: 'top',
                                        align: 'right'
                                    }
                                });
                            }
                            $(".loaderShare").hide();
                            $(".loadShare").show();
                        },
                        error: function (request) {
                            if (request.responseText) {
                                $.notify({
                                    icon: "add_alert",
                                    message: request.responseText
                                }, {
                                    type: 'danger',
                                    timer: 3000,
                                    placement: {
                                        from: 'top',
                                        align: 'right'
                                    }
                                });
                            }
                            console.error(request);
                        }
                    });
                });

                $(".loaderShare").hide();
                $(".loadShare").show();
            },
            error: function (request) {
                if (request.responseText) {
                    $.notify({
                        icon: "add_alert",
                        message: request.responseText
                    }, {
                        type: 'danger',
                        timer: 3000,
                        placement: {
                            from: 'top',
                            align: 'right'
                        }
                    });
                }
                console.error(request);
            }
        });
    }

    this.getMetadataInfo = function (key) {
        for (let i = 0; i < metadata.length; i++) {
            if (metadata[i].key == key) {
                return metadata[i];
            }
        }
        return null;
    }

    this.getMetadataInfoFromLabel = function (label) {
        for (let i = 0; i < metadata.length; i++) {
            if (metadata[i].label == label) {
                return metadata[i];
            }
        }
        return null;
    }

    this.getMetadataLabel = function (key) {
        return key.replace(/external_metadata./g, "").replace(/_/g, " ");
    }

    this.getMetadataKey = function (key) {
        return key.replace(/external_metadata./g, "");
    }

    this.getMetadata = function (idRoot, id) {
        let that = this;
        $.ajax({
            url: global.api_url + "steps/" + id + "/qa/get_metatadata_fields",
            type: 'GET',
            dataType: 'json',
            contentType: 'application/json',
            data: {
                idRoot: idRoot
            },
            success: function (response) {
                console.log("Return metadata", response);
                if (response.fields) {
                    metadata = response.fields;

                    for (let i = 0; i < metadata.length; i++) {
                        if (!metadata[i].label) {
                            metadata[i].label = that.getMetadataLabel(metadata[i].field);
                            metadata[i].key = that.getMetadataKey(metadata[i].field);
                        }
                    }
                }

            }, error: function (request) {
                if (request.responseText) {
                    $.notify({
                        icon: "add_alert",
                        message: request.responseText
                    }, {
                        type: 'danger',
                        timer: 3000,
                        placement: {
                            from: 'top',
                            align: 'right'
                        }
                    });
                }
                console.log(request);
            }
        });
    }
}

$(document).ready(function () {
    let agataObject = new Agata();
    agataObject.init();
});
