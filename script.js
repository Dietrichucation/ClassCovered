document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const csvFileInput = document.getElementById('csvFile');
    const fileStatusP = document.getElementById('file-status');
    const analyzeButton = document.getElementById('analyzeButton'); 
    
    const periodsChecklistDiv = document.getElementById('periodsChecklistDiv');
    const departmentChecklistForFilterDiv = document.getElementById('departmentChecklistForFilter');
    const teachersChecklistDiv = document.getElementById('teachersChecklist');

    const pdTeachersListUl = document.getElementById('pdTeachersList');
    const externalSubsNeededP = document.getElementById('externalSubsNeeded');
    const coverageBreakdownDiv = document.getElementById('coverageBreakdownDiv');
    const finalSubsNeededSpan = document.getElementById('finalSubsNeeded');
    const errorMessageDiv = document.getElementById('error-message');

    const visualScheduleTableContainer = document.getElementById('visualScheduleTableContainer');

    const scenarioPlanningSection = document.getElementById('scenario-planning-section');
    const numDedicatedSubsToAssignInput = document.getElementById('numDedicatedSubsToAssign'); 
    const assignDedicatedSubsToTeachersDiv = document.getElementById('assignDedicatedSubsToTeachersDiv'); 
    const dedicatedSubNameFieldsContainer = document.getElementById('dedicatedSubNameFieldsContainer'); 
    const numRovingSubsAvailableInput = document.getElementById('numRovingSubsAvailable'); 
    const rovingSubNameFieldsContainer = document.getElementById('rovingSubNameFieldsContainer'); 
    const applyScenarioButton = document.getElementById('applyScenarioButton');
    const scenarioResultsDiv = document.getElementById('scenarioResults');

    const confirmPdTeachersButton = document.getElementById('confirmPdTeachersButton');
    const teacherSpecificPdPeriodsSection = document.getElementById('teacher-specific-pd-periods-section');
    const teacherSpecificPeriodsChecklistDiv = document.getElementById('teacherSpecificPeriodsChecklist');

    const manualRovingAssignModeButton = document.getElementById('manualRovingAssignModeButton'); 
    const manualAssignInfoDiv = document.getElementById('manual-assign-info');
    const maxRovingSubsInfoSpan = document.getElementById('maxRovingSubsInfo');
    const finalizeManualAssignmentsButton = document.getElementById('finalizeManualAssignmentsButton'); 
    
    const printButton = document.getElementById('printButton'); 
    const printDownloadSection = document.getElementById('print-download-section'); 

    const manualInHouseAssignmentUI = document.getElementById('manual-in-house-assignment-ui');
    const manualInHouseAssignmentsContainer = document.getElementById('manualInHouseAssignmentsContainer'); 

    const preAssignmentSection = document.getElementById('pre-assignment-section');
    const preAssignDedicatedSubsUiDiv = document.getElementById('pre-assign-dedicated-subs-ui'); 
    const preAssignRovingSubsUiDiv = document.getElementById('pre-assign-roving-subs-ui');   
    const preAssignDedicatedSubsList = document.getElementById('preAssignDedicatedSubsList');
    const numPreRovingSubsAvailableInput = document.getElementById('numPreRovingSubsAvailable');
    const preRovingSubNameFieldsContainer = document.getElementById('preRovingSubNameFieldsContainer');
    const proceedToAssignInitialRovingButton = document.getElementById('proceedToAssignInitialRovingButton');
    
    const finalizeExternalSubsAndProceedToInHouseButton = document.getElementById('finalizeExternalSubsAndProceedToInHouseButton'); 
    const coverClassesWithInHouseButton = document.getElementById('coverClassesWithInHouseButton'); 

    const resultsSection = document.getElementById('results-section');


    // --- Global State Variables ---
    const PREP_KEYWORD = "PREP"; 
    const AUTOMATIC_IN_HOUSE_KEYWORD = "AUTOMATIC_IN_HOUSE"; 
    const NO_IN_HOUSE_COVER_KEYWORD = "NO_IN_HOUSE_COVER";   


    let masterSchedule = [];
    let allPeriodKeys = []; 
    let allAvailableDepartments = new Set();
    let selectedPdTeachersWithPeriods = {}; 
    let manualInHouseAssignments = {}; 

    let initialAnalysisData = { 
        pdTeachersFullObjects: [],
        selectedPeriodsPerTeacher: {}, 
        classesNeedingCoverageOriginal: [], 
        preAssignedDedicatedSubsData: {}, 
        initialManualRovingAssignmentsData: {}, 
        coverageAfterExternalSubs: [], 
        finalCoveragePlan: [], 
        dedicatedSubCustomNames: {}, 
        rovingSubCustomNames: {}    
    }; 
    
    let isManualAssignModeActiveForRoving = false; 
    let currentWorkingClassesForScenario = []; 
    let manualRovingAssignments = {}; 
    let currentNumRovingSubsForManual = 0; 
    let currentRovingSubCustomNamesForManual = {}; 

    // --- EVENT LISTENERS ---
    csvFileInput.addEventListener('change', handleFileUpload);
    applyScenarioButton.addEventListener('click', runScenarioAnalysis);
    
    if(printButton){ 
        printButton.addEventListener('click', () => {
            const planToPrint = scenarioResultsDiv.innerHTML.trim() !== '' && scenarioResultsDiv.style.display !== 'none' && !scenarioResultsDiv.querySelector('p.no-coverage')
                                      ? currentWorkingClassesForScenario 
                                      : initialAnalysisData.finalCoveragePlan; 

            if (!planToPrint || planToPrint.length === 0 && Object.keys(initialAnalysisData.preAssignedDedicatedSubsData).length === 0) {
                const visualScheduleTableCurrent = visualScheduleTableContainer.querySelector('.schedule-table');
                 if (!visualScheduleTableCurrent && Object.keys(initialAnalysisData.preAssignedDedicatedSubsData).length === 0) {
                    alert("No coverage plan or schedule to print yet. Please complete an analysis or scenario.");
                    return;
                }
            }

            const printWindow = window.open('', '_blank', 'height=800,width=1200,scrollbars=yes');
            if (!printWindow) {
                alert("Could not open print window. Please check your pop-up blocker settings.");
                return;
            }

            printWindow.document.write('<html><head><title>ClassCovered - Coverage Plan</title>');
            printWindow.document.write('<link rel="stylesheet" href="print-style.css" type="text/css" media="all">'); 
            printWindow.document.write(`
                <style> 
                    body { padding: 20px; } 
                    .schedule-table { 
                        width: 90% !important; 
                        margin-left: auto; 
                        margin-right: auto;
                        border: 1px solid #ccc !important; 
                        font-size: 8pt !important; 
                        margin-bottom: 20px;
                        border-collapse: collapse !important;
                    }
                    .schedule-table th, .schedule-table td {
                        border: 1px solid #ccc !important; 
                        padding: 4px !important; 
                    }
                    .schedule-table th { background-color: #eee !important; font-weight: bold; } 
                    .schedule-table td:first-child, .schedule-table th:first-child {
                        background-color: #f5f5f5 !important;  
                    }
                    .schedule-table tr.pd-teacher-row td:first-child { background-color: #e0e0e0 !important; }
                    .schedule-table td.pd-affected-cell { background-color: #f0f0f0 !important; }
                    .schedule-table td.pd-affected-cell.prep-during-pd { background-color: #dcdcdc !important; font-weight: bold;}
                    .schedule-table td.is-prep { color: #333 !important; font-weight: bold; }
                    .schedule-table td.needs-coverage-visual { background-color: #ffe0e0 !important; color: #c00 !important; } 
                    .schedule-table td.covered-by-inhouse-visual { background-color: #e0efff !important; } 
                    .schedule-table td.covered-by-roving-visual,
                    .schedule-table td.covered-by-manual-roving-visual { background-color: #fff8e0 !important; } 
                    .schedule-table td.covered-by-dedicated-visual { background-color: #efefef !important; } 
                    .schedule-table td .coverage-detail { font-size: 0.95em !important; color: #333 !important; margin-top: 1px; display: block; font-style: italic;}


                    .print-summary-details-columns li.print-list-item {
                         border: none !important; 
                         background-color: transparent !important; 
                         padding: 2px 0; 
                    }
                    .print-summary-details-columns ul.print-list > li.print-list-item > ul {
                        padding-left: 15px; 
                    }
                     .print-summary-details-columns hr.print-hr { 
                        margin: 6mm 0; border-top: 1px dotted #ccc;
                    }
                     .print-summary-details-columns .print-sub-heading { 
                        font-size: 12pt !important; color: #000 !important;
                        border-bottom: 1px dotted #ccc !important; margin-top: 6mm; margin-bottom: 2mm;
                    }
                     .print-summary-details-columns .print-teacher-heading {
                        font-size: 11pt !important; color: #000 !important;
                        margin-top: 4mm; margin-bottom: 1mm; border-bottom: none !important;
                    }


                    @media print { 
                        #doPrintButton { display: none !important; } 
                        body { padding: 0; } 
                        .print-summary-details-columns {
                            column-count: 2;
                            column-gap: 15mm; 
                        }
                         .print-summary-details-columns li.print-list-item {
                             border: 1px solid #f0f0f0 !important; 
                        }
                        .print-summary-details-columns .print-list-item,
                        .print-summary-details-columns .print-teacher-heading,
                        .print-summary-details-columns .print-sub-heading {
                            break-inside: avoid;
                            page-break-inside: avoid; 
                        }
                         .print-summary-details-columns hr.print-hr {
                             border-top: 1px solid #888 !important; 
                             column-span: all; 
                         }
                    } 
                </style>
            `);
            printWindow.document.write('</head><body>');
            
            printWindow.document.write('<button id="doPrintButton" onclick="window.print();" style="margin: 10px 0 20px 0; padding: 10px 20px; font-size: 16px; display: block; margin-left: auto; margin-right: auto;">PRINT THIS PAGE</button>');
            
            printWindow.document.write('<h1 class="print-main-title">ClassCovered - Coverage Plan</h1>');

            const visualScheduleTable = visualScheduleTableContainer.querySelector('.schedule-table');
            if (visualScheduleTable) {
                printWindow.document.write('<h2 class="print-section-title">Master Schedule</h2>');
                const clonedTable = visualScheduleTable.cloneNode(true);
                printWindow.document.write(clonedTable.outerHTML);
                printWindow.document.write('<div style="page-break-after: always;"></div>'); 
            } else {
                printWindow.document.write('<p class="print-paragraph">Master schedule not available.</p>');
            }

            printWindow.document.write('<h2 class="print-section-title">Coverage Summary</h2>');
            printWindow.document.write('<div class="print-summary-details-columns coverage-summary-section">'); 
            const summaryHTML = generatePrintSubSummaryHTML(planToPrint);
            printWindow.document.write(summaryHTML);
            printWindow.document.write('</div>'); 


            printWindow.document.write('</body></html>');
            printWindow.document.close(); 
            
            setTimeout(() => {
                 printWindow.focus();
            }, 500); 
        });
    }
    
    function generatePrintSubSummaryHTML(coveragePlan) {
        if (!coveragePlan && Object.keys(initialAnalysisData.preAssignedDedicatedSubsData).length === 0) {
            return '<p class="print-paragraph print-no-coverage">No coverage details to summarize.</p>';
        }
        let planToProcess = coveragePlan;
        if ((!planToProcess || planToProcess.length === 0) && Object.keys(initialAnalysisData.preAssignedDedicatedSubsData).length > 0) {
            planToProcess = [];
            Object.keys(initialAnalysisData.preAssignedDedicatedSubsData).forEach(pdTeacherName => {
                const subName = initialAnalysisData.preAssignedDedicatedSubsData[pdTeacherName]; 
                const teacherObj = masterSchedule.find(t => t['Teacher Name'] === pdTeacherName);
                if (teacherObj) {
                    (initialAnalysisData.selectedPeriodsPerTeacher[pdTeacherName] || []).forEach(period => {
                        if (teacherObj[period] && teacherObj[period].toUpperCase() !== PREP_KEYWORD) {
                            planToProcess.push({
                                pdTeacherName: pdTeacherName,
                                period: period,
                                className: teacherObj[period],
                                coveredBy: subName 
                            });
                        }
                    });
                }
            });
        }
         if (!planToProcess || planToProcess.length === 0) { 
             return '<p class="print-paragraph print-no-coverage">No coverage details to summarize.</p>';
         }


        let html = '';
        const absentTeachersDetails = {}; 
        
        const currentPdTeachersForSummary = initialAnalysisData.pdTeachersFullObjects && initialAnalysisData.pdTeachersFullObjects.length > 0 
            ? initialAnalysisData.pdTeachersFullObjects 
            : Object.keys(selectedPdTeachersWithPeriods).map(name => masterSchedule.find(t => t['Teacher Name'] === name)).filter(Boolean);


        currentPdTeachersForSummary.forEach(tObj => {
            absentTeachersDetails[tObj['Teacher Name']] = {
                dept: tObj.Department || 'N/A',
                periods: initialAnalysisData.selectedPeriodsPerTeacher[tObj['Teacher Name']] || [],
                allAffectedSlots: [] 
            };
        });

        const externalSubsUsed = {}; 
        const staffUsed = {};       

        const getPeriodNumberFromString = (periodString) => {
            if (typeof periodString !== 'string') return Infinity;
            const match = periodString.match(/\d+$/); 
            return match ? parseInt(match[0], 10) : Infinity;
        };

        planToProcess.forEach(slot => {
            if (!absentTeachersDetails[slot.pdTeacherName]) { 
                const teacherObj = masterSchedule.find(t => t['Teacher Name'] === slot.pdTeacherName);
                absentTeachersDetails[slot.pdTeacherName] = { 
                    dept: teacherObj ? teacherObj.Department || 'N/A' : 'N/A', 
                    periods: selectedPdTeachersWithPeriods[slot.pdTeacherName] || [], 
                    allAffectedSlots: []
                };
            }
            // Construct the text string with Period first
            let slotText;
            if (slot.coveredBy) {
                slotText = `${slot.period} (${slot.className}) by ${slot.coveredBy}`;
            } else {
                slotText = `${slot.period} (${slot.className})`;
            }

            absentTeachersDetails[slot.pdTeacherName].allAffectedSlots.push({
                rawText: slotText, 
                coveredBy: slot.coveredBy, 
                periodSortKey: getPeriodNumberFromString(slot.period)
            });

            // Populate externalSubsUsed and staffUsed (summary by sub/staff)
            if (slot.coveredBy) {
                if (slot.coveredBy.startsWith('Staff: ')) {
                    const staffName = slot.coveredBy.replace('Staff: ', '');
                    if (!staffUsed[staffName]) staffUsed[staffName] = [];
                    staffUsed[staffName].push({
                        text: `Covers ${slot.pdTeacherName}'s ${slot.period} (${slot.className})`, // Period first
                        periodSortKey: getPeriodNumberFromString(slot.period)
                    });
                } else if (slot.coveredBy.startsWith('Sub: ') || slot.coveredBy.startsWith('MRS: ')) { 
                    let subName = slot.coveredBy.replace(/^Sub:\s*|^MRS:\s*/, '');
                    if (!externalSubsUsed[subName]) externalSubsUsed[subName] = [];
                    externalSubsUsed[subName].push({
                        text: `Covers ${slot.pdTeacherName}'s ${slot.period} (${slot.className})`, // Period first
                        periodSortKey: getPeriodNumberFromString(slot.period)
                    });
                }
            }
        });

        html += `<h3 class="print-sub-heading">Absent Teacher Details:</h3>`;
        if (Object.keys(absentTeachersDetails).length > 0) {
            html += `<ul class="print-list">`; 
            Object.keys(absentTeachersDetails).sort().forEach(teacherName => {
                const details = absentTeachersDetails[teacherName];
                details.allAffectedSlots.sort((a,b) => a.periodSortKey - b.periodSortKey); // Sort slots by period

                html += `<li class="print-list-item"><strong>${teacherName}</strong> (${details.dept}), Absent: ${details.periods.join(', ') || 'N/A'}`;
                if (details.allAffectedSlots.length > 0) {
                    html += `<ul>`; 
                    details.allAffectedSlots.forEach(slot => {
                        if (slot.coveredBy) {
                            html += `<li class="print-list-item print-coverage-item">${slot.rawText}</li>`;
                        } else {
                            html += `<li class="print-list-item print-uncovered-item">${slot.rawText} - Needs Coverage</li>`;
                        }
                    });
                    html += `</ul>`;
                }
                html += `</li>`;
            });
            html += `</ul>`;
        } else {
            html += `<p class="print-paragraph">No teachers were marked absent or had classes needing coverage.</p>`;
        }
        html += '<hr class="print-hr">';


        html += `<h3 class="print-sub-heading">External Substitute Assignments:</h3>`;
        if (Object.keys(externalSubsUsed).length > 0) {
            html += `<ul class="print-list">`;
            for (const subName in externalSubsUsed) {
                externalSubsUsed[subName].sort((a,b) => a.periodSortKey - b.periodSortKey); 
                html += `<li class="print-list-item print-external-sub-item"><strong>Sub: ${subName}</strong><ul>`;
                externalSubsUsed[subName].forEach(detail => {
                    html += `<li class="print-list-item">${detail.text}</li>`;
                });
                html += `</ul></li>`;
            }
            html += `</ul>`;
        } else {
            html += `<p class="print-paragraph">No external substitutes assigned in this plan.</p>`;
        }
        html += '<hr class="print-hr">';

        html += `<h3 class="print-sub-heading">Internal Staff Coverage:</h3>`;
        if (Object.keys(staffUsed).length > 0) {
            html += `<ul class="print-list">`;
            for (const staffName in staffUsed) {
                staffUsed[staffName].sort((a,b) => a.periodSortKey - b.periodSortKey); 
                html += `<li class="print-list-item print-coverage-item"><strong>Staff: ${staffName}</strong><ul>`;
                staffUsed[staffName].forEach(detail => {
                    html += `<li class="print-list-item">${detail.text}</li>`;
                });
                html += `</ul></li>`;
            }
            html += `</ul>`;
        } else {
            html += `<p class="print-paragraph">No internal staff assigned to cover.</p>`;
        }
        html += '<hr class="print-hr">';

        const stillNeedsCoverageOverall = planToProcess.filter(slot => !slot.coveredBy)
                                              .sort((a,b) => getPeriodNumberFromString(a.period) - getPeriodNumberFromString(b.period)); 
        html += `<h3 class="print-sub-heading">Overall Classes Still Needing Coverage:</h3>`;
        if (stillNeedsCoverageOverall.length > 0) {
            html += `<ul class="print-list">`;
            stillNeedsCoverageOverall.forEach(item => {
                html += `<li class="print-list-item print-uncovered-item">${item.pdTeacherName} - ${item.period} (${item.className})</li>`;
            });
            html += `</ul>`;
        } else {
            html += `<p class="print-paragraph">All identified classes appear to be covered.</p>`;
        }

        return html;
    }


    if (numDedicatedSubsToAssignInput) {
        numDedicatedSubsToAssignInput.addEventListener('change', () => { 
            const relevantPdTeachers = (Object.keys(selectedPdTeachersWithPeriods) || []).map(name => masterSchedule.find(t => t['Teacher Name'] === name)).filter(Boolean)
                                        .filter(teacher => !initialAnalysisData.preAssignedDedicatedSubsData.hasOwnProperty(teacher['Teacher Name']));
            populateDedicatedSubAssignmentUI(relevantPdTeachers); 
            updateSubNameFields('dedicated', parseInt(numDedicatedSubsToAssignInput.value) || 0, dedicatedSubNameFieldsContainer);
        });
    }
    if (numRovingSubsAvailableInput) {
        numRovingSubsAvailableInput.addEventListener('change', () => {
            updateSubNameFields('roving', parseInt(numRovingSubsAvailableInput.value) || 0, rovingSubNameFieldsContainer);
             if (manualRovingAssignModeButton) { 
                manualRovingAssignModeButton.style.display = (parseInt(numRovingSubsAvailableInput.value) || 0) > 0 ? 'inline-block' : 'none';
            }
        });
    }

    teachersChecklistDiv.addEventListener('change', () => {
        const currentlySelectedTeachersInMainListCount = teachersChecklistDiv.querySelectorAll('input[name="pdTeacher"]:checked').length;
        const confirmedPdTeacherCount = Object.keys(selectedPdTeachersWithPeriods).length;

        if (currentlySelectedTeachersInMainListCount > 0) {
            confirmPdTeachersButton.style.display = 'inline-block';
            confirmPdTeachersButton.textContent = (confirmedPdTeacherCount > 0 && currentlySelectedTeachersInMainListCount !== confirmedPdTeacherCount) || (confirmedPdTeacherCount > 0 && !allCheckedTeachersAreConfirmed()) 
                                                ? "Update Confirmed Teacher List" 
                                                : "Confirm Teachers & Set Absence Periods";
        } else { 
            confirmPdTeachersButton.style.display = 'none';
            if (teacherSpecificPdPeriodsSection) teacherSpecificPdPeriodsSection.style.display = 'none';
            if (preAssignmentSection) {
                preAssignmentSection.style.display = 'none';
                preAssignmentSection.style.opacity = '1'; 
            }
            if (manualInHouseAssignmentUI) {
                manualInHouseAssignmentUI.style.display = 'none';
                manualInHouseAssignmentUI.style.opacity = '1'; 
            }
            if (finalizeExternalSubsAndProceedToInHouseButton) finalizeExternalSubsAndProceedToInHouseButton.style.display = 'none';
            if (coverClassesWithInHouseButton) coverClassesWithInHouseButton.style.display = 'none';
        }
    });
    
    function allCheckedTeachersAreConfirmed() {
        const checkedTeacherNames = Array.from(teachersChecklistDiv.querySelectorAll('input[name="pdTeacher"]:checked')).map(cb => cb.value);
        if (checkedTeacherNames.length !== Object.keys(selectedPdTeachersWithPeriods).length) return false; 
        return checkedTeacherNames.every(name => selectedPdTeachersWithPeriods.hasOwnProperty(name));
    }

    confirmPdTeachersButton.addEventListener('click', () => {
        const defaultPdPeriodsFromGlobalSelector = getSelectedPdPeriods(); 
        const checkedTeacherNamesInList = Array.from(teachersChecklistDiv.querySelectorAll('input[name="pdTeacher"]:checked')).map(cb => cb.value);

        Object.keys(selectedPdTeachersWithPeriods).forEach(confirmedTeacherName => {
            if (!checkedTeacherNamesInList.includes(confirmedTeacherName)) {
                handleRemovePdTeacherFromState(confirmedTeacherName); 
            }
        });

        checkedTeacherNamesInList.forEach(teacherName => {
            if (!selectedPdTeachersWithPeriods.hasOwnProperty(teacherName)) { 
                selectedPdTeachersWithPeriods[teacherName] = [...defaultPdPeriodsFromGlobalSelector].sort((a, b) => getPeriodNumber(a) - getPeriodNumber(b)); 
            }
             else if (selectedPdTeachersWithPeriods[teacherName]) { 
                selectedPdTeachersWithPeriods[teacherName].sort((a, b) => getPeriodNumber(a) - getPeriodNumber(b));
            }
        });
        
        populateTeacherSpecificPeriodsUI(); 
        populatePreAssignDedicatedSubsUI(); 

        if (Object.keys(selectedPdTeachersWithPeriods).length > 0) {
            if (teacherSpecificPdPeriodsSection) teacherSpecificPdPeriodsSection.style.display = 'block'; 
            if (preAssignmentSection) {
                preAssignmentSection.style.display = 'block';
                preAssignmentSection.style.opacity = '1'; 
                if(preAssignDedicatedSubsUiDiv) preAssignDedicatedSubsUiDiv.style.opacity = '1';
                if(preAssignRovingSubsUiDiv) preAssignRovingSubsUiDiv.style.opacity = '1';
            }

            if (numPreRovingSubsAvailableInput) {
                const numRoving = parseInt(numPreRovingSubsAvailableInput.value) || 0; 
                 if (proceedToAssignInitialRovingButton) {
                    proceedToAssignInitialRovingButton.style.display = 'inline-block';
                    proceedToAssignInitialRovingButton.disabled = false;
                    proceedToAssignInitialRovingButton.textContent = numRoving > 0 ? "Proceed to Assign Initial Roving Subs" : "Apply Dedicated Subs & Continue to In-House";
                }
            }
            
            if (manualInHouseAssignmentUI) {
                manualInHouseAssignmentUI.style.display = 'none'; 
                manualInHouseAssignmentUI.style.opacity = '1'; 
            }
            if (finalizeExternalSubsAndProceedToInHouseButton) finalizeExternalSubsAndProceedToInHouseButton.style.display = 'none';
            if (coverClassesWithInHouseButton) coverClassesWithInHouseButton.style.display = 'none';
            if (analyzeButton) analyzeButton.style.display = 'none'; 

            updateVisualScheduleForPreAssignments(); 
            if (resultsSection) resultsSection.style.display = 'none'; 
            if (scenarioPlanningSection) scenarioPlanningSection.style.display = 'none';
            confirmPdTeachersButton.textContent = "Update Confirmed Teacher List";

        } else { 
            displayError("Please select teachers from the checklist to add to the PD plan.");
            if (teacherSpecificPdPeriodsSection) teacherSpecificPdPeriodsSection.style.display = 'none'; 
            if (preAssignmentSection) preAssignmentSection.style.display = 'none';
            if (manualInHouseAssignmentUI) manualInHouseAssignmentUI.style.display = 'none';
            confirmPdTeachersButton.textContent = "Confirm Teachers & Set Absence Periods";
            updateVisualScheduleForPreAssignments(); 
        }
    });

    if (numPreRovingSubsAvailableInput) {
        numPreRovingSubsAvailableInput.addEventListener('change', () => {
            const numRoving = parseInt(numPreRovingSubsAvailableInput.value) || 0;
            updateSubNameFields('preRoving', numRoving, preRovingSubNameFieldsContainer);
            if (proceedToAssignInitialRovingButton) {
                 proceedToAssignInitialRovingButton.disabled = false; 
                 proceedToAssignInitialRovingButton.textContent = numRoving > 0 ? "Proceed to Assign Initial Roving Subs" : "Apply Dedicated Subs & Continue to In-House";
                 proceedToAssignInitialRovingButton.style.display = 'inline-block'; 
            }
            if(preAssignRovingSubsUiDiv) preAssignRovingSubsUiDiv.style.opacity = '1';
            if (preAssignmentSection) preAssignmentSection.style.opacity = '1'; 


            if (finalizeExternalSubsAndProceedToInHouseButton) finalizeExternalSubsAndProceedToInHouseButton.style.display = 'none';
            if (manualInHouseAssignmentUI) manualInHouseAssignmentUI.style.display = 'none';
            if (coverClassesWithInHouseButton) coverClassesWithInHouseButton.style.display = 'none';
            isManualAssignModeActiveForRoving = false; 
            updateVisualScheduleForManualRovingMode(false);
            if(manualAssignInfoDiv) manualAssignInfoDiv.style.display = 'none';
        });
        numPreRovingSubsAvailableInput.addEventListener('focus', () => {
            if(preAssignRovingSubsUiDiv) preAssignRovingSubsUiDiv.style.opacity = '1';
            if(preAssignDedicatedSubsUiDiv) preAssignDedicatedSubsUiDiv.style.opacity = '1'; 
            if (preAssignmentSection) preAssignmentSection.style.opacity = '1';
            if (proceedToAssignInitialRovingButton && proceedToAssignInitialRovingButton.style.display === 'none') {
                 if(finalizeExternalSubsAndProceedToInHouseButton) finalizeExternalSubsAndProceedToInHouseButton.style.display = 'none';
                 proceedToAssignInitialRovingButton.style.display = 'inline-block';
                const numRoving = parseInt(numPreRovingSubsAvailableInput.value) || 0;
                proceedToAssignInitialRovingButton.textContent = numRoving > 0 ? "Proceed to Assign Initial Roving Subs" : "Apply Dedicated Subs & Continue to In-House";
            }
        });
    }

    if (proceedToAssignInitialRovingButton) {
        proceedToAssignInitialRovingButton.addEventListener('click', () => {
            currentNumRovingSubsForManual = parseInt(numPreRovingSubsAvailableInput.value) || 0;
            currentRovingSubCustomNamesForManual = getSubCustomNames('preRoving', currentNumRovingSubsForManual); 
    
            if (preAssignDedicatedSubsUiDiv) preAssignDedicatedSubsUiDiv.style.opacity = '0.5'; 
            if (preAssignRovingSubsUiDiv) preAssignRovingSubsUiDiv.style.opacity = '0.5';
            proceedToAssignInitialRovingButton.style.display = 'none'; 
    
            if (currentNumRovingSubsForManual > 0) {
                if (finalizeExternalSubsAndProceedToInHouseButton) {
                    finalizeExternalSubsAndProceedToInHouseButton.style.display = 'inline-block';
                    finalizeExternalSubsAndProceedToInHouseButton.disabled = false;
                }
                isManualAssignModeActiveForRoving = true;
                if (manualAssignInfoDiv) manualAssignInfoDiv.style.display = 'block';
                if (maxRovingSubsInfoSpan) maxRovingSubsInfoSpan.textContent = currentNumRovingSubsForManual;
                manualRovingAssignments = {}; 
                updateVisualScheduleForManualRovingMode(true); 
                alert("INITIAL ROVING SUB ASSIGNMENT: Click on highlighted PD teacher cells in the Master Schedule to assign your pre-defined roving subs.");
            } else {
                manualRovingAssignments = {}; 
                handleFinalizeExternalSubsAndProceedToInHouse(); 
                if (finalizeExternalSubsAndProceedToInHouseButton) {
                     finalizeExternalSubsAndProceedToInHouseButton.style.display = 'none';
                }
            }
        });
    }
    
    if (finalizeExternalSubsAndProceedToInHouseButton) {
        finalizeExternalSubsAndProceedToInHouseButton.addEventListener('click', handleFinalizeExternalSubsAndProceedToInHouse);
    }

    if (coverClassesWithInHouseButton) {
        coverClassesWithInHouseButton.textContent = "Cover Classes!"; 
        coverClassesWithInHouseButton.addEventListener('click', handleCoverClassesWithInHouse);
    }
    

    if (manualRovingAssignModeButton) {
        manualRovingAssignModeButton.addEventListener('click', () => {
            isManualAssignModeActiveForRoving = true; 
            if(manualAssignInfoDiv) manualAssignInfoDiv.style.display = 'block';
            manualRovingAssignModeButton.style.display = 'none'; 
            if(finalizeManualAssignmentsButton) finalizeManualAssignmentsButton.style.display = 'inline-block';
            
            currentNumRovingSubsForManual = parseInt(numRovingSubsAvailableInput.value) || 0;
            currentRovingSubCustomNamesForManual = getSubCustomNames('roving', currentNumRovingSubsForManual); 

            if(maxRovingSubsInfoSpan) maxRovingSubsInfoSpan.textContent = currentNumRovingSubsForManual;
            updateVisualScheduleForManualRovingMode(true); 
            alert("SCENARIO Manual Roving Sub Assignment: Click on highlighted cells to assign/clear SCENARIO roving subs.");
        });
    }

    if (finalizeManualAssignmentsButton) { 
        finalizeManualAssignmentsButton.addEventListener('click', () => {
            isManualAssignModeActiveForRoving = false; 
            if(manualAssignInfoDiv) manualAssignInfoDiv.style.display = 'none';
            if(manualRovingAssignModeButton) manualRovingAssignModeButton.style.display = 'inline-block'; 
            if(finalizeManualAssignmentsButton) finalizeManualAssignmentsButton.style.display = 'none';
            
            currentWorkingClassesForScenario.forEach(cls => {
                if (cls.coveredBy && cls.coveredBy.startsWith('Sub: ') && !cls.coveredBy.startsWith('MRS:')) { 
                    let manualOverrideFound = false;
                    for (const roverKey in manualRovingAssignments) { 
                        const plainRoverId = roverKey.replace('MRS-','').replace(/_/g,'').replace(/^Sub:\s*/,''); 
                        
                        let isCurrentScenarioRover = false;
                        for(const keyInCustomNames in currentRovingSubCustomNamesForManual){ 
                            if(currentRovingSubCustomNamesForManual[keyInCustomNames].replace(/^Sub:\s*/,'') === plainRoverId){
                                isCurrentScenarioRover = true;
                                break;
                            }
                        }

                        if (isCurrentScenarioRover) {
                            if (manualRovingAssignments[roverKey][cls.period] &&
                                manualRovingAssignments[roverKey][cls.period].teacher === cls.pdTeacherName &&
                                manualRovingAssignments[roverKey][cls.period].className === cls.className) {
                                manualOverrideFound = true;
                                break;
                            }
                        }
                    }
                    if(manualOverrideFound) cls.coveredBy = null; 
                } else if (cls.coveredBy && cls.coveredBy.startsWith('MRS:')) { 
                     cls.coveredBy = null;
                }
            });
            
            for (const roverKey in manualRovingAssignments) { 
                const plainRoverId = roverKey.replace('MRS-','').replace(/_/g,'').replace(/^Sub:\s*/,''); 
                let isCurrentScenarioRover = false;
                for(const keyInCustomNames in currentRovingSubCustomNamesForManual){
                    if(currentRovingSubCustomNamesForManual[keyInCustomNames].replace(/^Sub:\s*/,'') === plainRoverId){
                        isCurrentScenarioRover = true;
                        break;
                    }
                }
                if (isCurrentScenarioRover) { 
                    for (const periodKey in manualRovingAssignments[roverKey]) {
                        const assignment = manualRovingAssignments[roverKey][periodKey];
                        const classSlot = currentWorkingClassesForScenario.find(c => c.pdTeacherName === assignment.teacher && c.period === periodKey && c.className === assignment.className);
                        if (classSlot) { 
                            classSlot.coveredBy = assignment.subDisplayName; 
                        } 
                    }
                }
            }
            
            displayVisualSchedule(masterSchedule, allPeriodKeys, {
                pdTeachersFullObjects: initialAnalysisData.pdTeachersFullObjects, 
                selectedPeriodsPerTeacher: initialAnalysisData.selectedPeriodsPerTeacher, 
                finalCoveragePlan: currentWorkingClassesForScenario 
            });
            updateScenarioTextualSummary(currentWorkingClassesForScenario, {
                isScenario: true,
                numDedicatedSubsAssignedToTeachersScenario: Array.from(assignDedicatedSubsToTeachersDiv.querySelectorAll('input[name="teacherGetsDedicatedSub"]:checked')).length,
                numRovingSubsInputScenario: parseInt(numRovingSubsAvailableInput.value), 
                teachersAssignedDedicatedSubNamesFromScenario: Array.from(assignDedicatedSubsToTeachersDiv.querySelectorAll('input[name="teacherGetsDedicatedSub"]:checked')).map(cb => cb.value),
                dedicatedSubCustomNamesScenario: getSubCustomNames('dedicated', parseInt(numDedicatedSubsToAssignInput.value) || 0), 
                rovingSubCustomNamesScenario: currentRovingSubCustomNamesForManual 
            });
            updateVisualScheduleForManualRovingMode(false); 
        });
    }

    function handleRemovePdTeacherFromState(teacherNameToRemove) { 
        delete selectedPdTeachersWithPeriods[teacherNameToRemove];
        delete initialAnalysisData.preAssignedDedicatedSubsData[teacherNameToRemove];
    }

    function handleRemovePdTeacherFromCustomizationUI(event) {
        const teacherNameToRemove = event.target.dataset.teacherName;

        handleRemovePdTeacherFromState(teacherNameToRemove); 

        const mainChecklistCheckbox = teachersChecklistDiv.querySelector(`input[name="pdTeacher"][value="${teacherNameToRemove}"]`);
        if (mainChecklistCheckbox) {
            mainChecklistCheckbox.checked = false;
        }

        event.target.closest('.teacher-period-group').remove();
        if (teacherSpecificPeriodsChecklistDiv.children.length === 0 && !teacherSpecificPeriodsChecklistDiv.querySelector('.placeholder-text')) {
            teacherSpecificPeriodsChecklistDiv.innerHTML = '<p class="placeholder-text">No teachers confirmed for PD.</p>';
        }


        const preAssignRow = preAssignDedicatedSubsList.querySelector(`.pre-assign-dedicated-item input[data-teacher-name="${teacherNameToRemove}"]`);
        if (preAssignRow && preAssignDedicatedSubsList.contains(preAssignRow.closest('.pre-assign-dedicated-item'))) {
            preAssignRow.closest('.pre-assign-dedicated-item').remove();
        }
        if (preAssignDedicatedSubsList.children.length === 0 && !preAssignDedicatedSubsList.querySelector('p.placeholder-text')) {
             preAssignDedicatedSubsList.innerHTML = '<p class="placeholder-text">No PD teachers remaining.</p>';
        }

        updateVisualScheduleForPreAssignments();

        if (Object.keys(selectedPdTeachersWithPeriods).length === 0) {
            if(teacherSpecificPdPeriodsSection) teacherSpecificPdPeriodsSection.style.display = 'none';
            if(preAssignmentSection) preAssignmentSection.style.display = 'none';
            if(manualInHouseAssignmentUI) manualInHouseAssignmentUI.style.display = 'none';
            if (confirmPdTeachersButton) confirmPdTeachersButton.textContent = "Confirm Teachers & Set Absence Periods";
        } else {
            if (confirmPdTeachersButton) confirmPdTeachersButton.textContent = "Update Confirmed Teacher List";
        }
        teachersChecklistDiv.dispatchEvent(new Event('change'));
    }

    function addTeacherToCustomizationUI(teacher, teacherPeriods) {
        if (!teacherSpecificPeriodsChecklistDiv) return;
        const teacherName = teacher['Teacher Name'];

        let groupDiv = teacherSpecificPeriodsChecklistDiv.querySelector(`.teacher-period-group input[data-teacher-name="${teacherName}"]`)?.closest('.teacher-period-group');
        
        if (!groupDiv) { 
            groupDiv = document.createElement('div'); groupDiv.className = 'teacher-period-group';
            
            const headerDiv = document.createElement('div');
            headerDiv.style.display = 'flex';
            headerDiv.style.justifyContent = 'space-between';
            headerDiv.style.alignItems = 'center';

            const nameHeader = document.createElement('h5'); nameHeader.textContent = teacherName; 
            headerDiv.appendChild(nameHeader);

            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'X Remove';
            removeBtn.classList.add('remove-pd-teacher-btn'); 
            removeBtn.style.marginLeft = '10px'; removeBtn.style.padding = '2px 6px'; 
            removeBtn.style.backgroundColor = '#dc3545'; removeBtn.style.color = 'white';
            removeBtn.style.border = 'none'; removeBtn.style.borderRadius = '3px';
            removeBtn.style.cursor = 'pointer'; removeBtn.style.fontSize = '0.8em';
            removeBtn.dataset.teacherName = teacherName;
            removeBtn.addEventListener('click', handleRemovePdTeacherFromCustomizationUI);
            headerDiv.appendChild(removeBtn);
            
            groupDiv.appendChild(headerDiv);

            const periodsDiv = document.createElement('div'); periodsDiv.className = 'periods-for-teacher';
            groupDiv.appendChild(periodsDiv); 
            
            const placeholder = teacherSpecificPeriodsChecklistDiv.querySelector('p.error, p.placeholder-text'); 
            if(placeholder) placeholder.remove();
            teacherSpecificPeriodsChecklistDiv.appendChild(groupDiv);
        }
        
        const periodsDiv = groupDiv.querySelector('.periods-for-teacher');
        periodsDiv.innerHTML = ''; 
        allPeriodKeys.forEach(periodKey => {
            const label = document.createElement('label'); const checkbox = document.createElement('input');
            checkbox.type = 'checkbox'; checkbox.dataset.teacherName = teacherName; checkbox.value = periodKey;
            checkbox.checked = teacherPeriods.includes(periodKey); 
            checkbox.addEventListener('change', (event) => {
                const tName = event.target.dataset.teacherName; const periodVal = event.target.value;
                if (!selectedPdTeachersWithPeriods[tName]) selectedPdTeachersWithPeriods[tName] = [];
                if (event.target.checked) {
                    if (!selectedPdTeachersWithPeriods[tName].includes(periodVal)) selectedPdTeachersWithPeriods[tName].push(periodVal);
                } else {
                    selectedPdTeachersWithPeriods[tName] = selectedPdTeachersWithPeriods[tName].filter(p => p !== periodVal);
                }
                selectedPdTeachersWithPeriods[tName].sort((a, b) => getPeriodNumber(a) - getPeriodNumber(b));

                if (preAssignmentSection && preAssignmentSection.style.display === 'block' && !isManualAssignModeActiveForRoving) {
                    updateVisualScheduleForPreAssignments();
                }
            });
            label.appendChild(checkbox); label.appendChild(document.createTextNode(periodKey.replace('Period ','P')));
            periodsDiv.appendChild(label);
        });
    }

    function addTeacherToPreAssignDedicatedUI(teacher) {
        if (!preAssignDedicatedSubsList) return;
        const teacherName = teacher['Teacher Name'];

        const placeholder = preAssignDedicatedSubsList.querySelector('p.placeholder-text');
        if (placeholder) placeholder.remove();

        let div = preAssignDedicatedSubsList.querySelector(`.pre-assign-dedicated-item input[data-teacher-name="${teacherName}"]`)?.closest('.pre-assign-dedicated-item');
        
        if (!div) { 
            div = document.createElement('div'); div.className = 'pre-assign-dedicated-item'; div.style.marginBottom = '8px';
            const checkbox = document.createElement('input'); checkbox.type = 'checkbox';
            const uniqueCheckboxId = `preDedicatedFor-${teacherName.replace(/[^a-zA-Z0-9]/g, '_')}`; 
            checkbox.id = uniqueCheckboxId; checkbox.dataset.teacherName = teacherName;
            
            const label = document.createElement('label'); label.htmlFor = uniqueCheckboxId; label.style.cursor = 'pointer';
            const nameInput = document.createElement('input'); nameInput.type = 'text';
            const uniqueNameInputId = `preDedicatedNameFor-${teacherName.replace(/[^a-zA-Z0-9]/g, '_')}`;
            nameInput.id = uniqueNameInputId; nameInput.placeholder = 'Sub Name (Optional)'; 
            nameInput.style.marginLeft = '10px'; nameInput.style.padding = '4px'; nameInput.style.fontSize = '0.9em';
            
            label.appendChild(checkbox); label.appendChild(document.createTextNode(` ${teacherName}`));
            div.appendChild(label); div.appendChild(nameInput);
            preAssignDedicatedSubsList.appendChild(div);

            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    nameInput.style.display = 'inline-block';
                    initialAnalysisData.preAssignedDedicatedSubsData[teacherName] = `Sub: ${nameInput.value.trim() || teacherName}`; 
                } else {
                    nameInput.style.display = 'none';
                    delete initialAnalysisData.preAssignedDedicatedSubsData[teacherName];
                    nameInput.value = '';
                }
                if(preAssignDedicatedSubsUiDiv) preAssignDedicatedSubsUiDiv.style.opacity = '1'; 
                if(preAssignmentSection) preAssignmentSection.style.opacity = '1';
                updateVisualScheduleForPreAssignments();
            });
            nameInput.addEventListener('input', () => {
                if (checkbox.checked) {
                    initialAnalysisData.preAssignedDedicatedSubsData[teacherName] = `Sub: ${nameInput.value.trim() || teacherName}`; 
                    updateVisualScheduleForPreAssignments();
                }
            });
            nameInput.addEventListener('focus', () => { 
                if(preAssignDedicatedSubsUiDiv) preAssignDedicatedSubsUiDiv.style.opacity = '1';
                if(preAssignmentSection) preAssignmentSection.style.opacity = '1';
                if (proceedToAssignInitialRovingButton && proceedToAssignInitialRovingButton.style.display === 'none') {
                     if(finalizeExternalSubsAndProceedToInHouseButton) finalizeExternalSubsAndProceedToInHouseButton.style.display = 'none';
                     proceedToAssignInitialRovingButton.style.display = 'inline-block';
                    const numRoving = parseInt(numPreRovingSubsAvailableInput.value) || 0;
                    proceedToAssignInitialRovingButton.textContent = numRoving > 0 ? "Proceed to Assign Initial Roving Subs" : "Apply Dedicated Subs & Continue to In-House";
                }
            });
        }
        const checkbox = div.querySelector('input[type="checkbox"]');
        const nameInput = div.querySelector('input[type="text"]');
        if (initialAnalysisData.preAssignedDedicatedSubsData[teacherName]) {
            checkbox.checked = true;
            let currentName = initialAnalysisData.preAssignedDedicatedSubsData[teacherName];
            if (currentName === `Sub: ${teacherName}`) { 
                nameInput.value = ''; 
            } else {
                nameInput.value = currentName.replace(/^Sub:\s*/, ''); 
            }
            nameInput.style.display = 'inline-block';
        } else {
            checkbox.checked = false;
            nameInput.style.display = 'none';
            nameInput.value = '';
        }
    }

    function getPeriodNumber(periodString) { 
        if (typeof periodString !== 'string') return Infinity;
        const match = periodString.match(/\d+$/); 
        return match ? parseInt(match[0], 10) : Infinity;
    }

    function findAndAssignAutomaticInHouseCoverage(classesToCover, allTeachersSchedule, schoolPeriodKeys, existingInternalCoverUsage, currentPdTeachersWithPeriods) {
        let newAssignmentsMade = false;
        classesToCover.forEach(classSlot => {
            if (classSlot.coveredBy) return; 

            const pdTeacherName = classSlot.pdTeacherName;
            const periodToCover = classSlot.period;

            for (const potentialCoverTeacher of allTeachersSchedule) {
                const potentialCoverTeacherName = potentialCoverTeacher['Teacher Name'];
                
                if (potentialCoverTeacherName === pdTeacherName) continue; 

                const isPotentialCoverTeacherAlsoAbsent = (currentPdTeachersWithPeriods[potentialCoverTeacherName] || []).includes(periodToCover);
                if (isPotentialCoverTeacherAlsoAbsent) continue;


                if (potentialCoverTeacher[periodToCover] && potentialCoverTeacher[periodToCover].toUpperCase() === PREP_KEYWORD) {
                    if (existingInternalCoverUsage[periodToCover] && existingInternalCoverUsage[periodToCover].includes(potentialCoverTeacherName)) {
                        continue; 
                    }
                    classSlot.coveredBy = `Staff: ${potentialCoverTeacherName}`;
                    newAssignmentsMade = true;

                    if (!existingInternalCoverUsage[periodToCover]) {
                        existingInternalCoverUsage[periodToCover] = [];
                    }
                    existingInternalCoverUsage[periodToCover].push(potentialCoverTeacherName);
                    break; 
                }
            }
        });
        return newAssignmentsMade;
    }

    function handleFileUpload(event) { 
        clearAllOutputs(); 
        if (analyzeButton) analyzeButton.style.display = 'none'; 
        const file = event.target.files[0];
        if (file) {
            fileStatusP.textContent = `Parsing file: ${file.name}...`; 
            try { 
                Papa.parse(file, { 
                    header: true, skipEmptyLines: true,
                    complete: function(results) {
                        if (results.errors.length > 0) { 
                            displayError("Error parsing CSV: " + results.errors.map(e => e.message).join(', ')); 
                            fileStatusP.textContent = `Error parsing ${file.name}. Check format.`; 
                            masterSchedule = []; allPeriodKeys = []; allAvailableDepartments = new Set(); return; 
                        }
                        if (results.data.length === 0) { 
                            displayError("CSV file is empty or has no data rows."); 
                            fileStatusP.textContent = `File ${file.name} is empty or invalid.`; 
                            masterSchedule = []; allPeriodKeys = []; allAvailableDepartments = new Set(); return; 
                        }
                        masterSchedule = results.data.filter(row => row['Teacher Name'] && row['Teacher Name'].trim() !== ''); 
                        if (masterSchedule.length === 0) { 
                            displayError("No valid teacher data found in CSV."); 
                            fileStatusP.textContent = `No valid teacher data in ${file.name}.`; 
                            allPeriodKeys = []; allAvailableDepartments = new Set(); return; 
                        }
                        const firstRowKeys = Object.keys(results.data[0]);
                        allPeriodKeys = firstRowKeys.filter(key => 
                            key.toLowerCase().startsWith('period ') && 
                            !isNaN(parseInt(key.toLowerCase().split('period ')[1]))
                        ).sort((a, b) => { 
                            const numA = parseInt(a.toLowerCase().split('period ')[1]);
                            const numB = parseInt(b.toLowerCase().split('period ')[1]);
                            return numA - numB;
                        });

                        allAvailableDepartments = new Set(masterSchedule.map(t => t.Department).filter(d => d && d.trim() !== ''));
                        if (allPeriodKeys.length === 0) { 
                            displayError("Could not find valid 'Period X' columns in the CSV header."); 
                            fileStatusP.textContent = `Invalid period columns in ${file.name}.`; 
                            masterSchedule = []; 
                        } else {
                            fileStatusP.textContent = `File ${file.name} parsed. ${masterSchedule.length} teachers. Periods: ${allPeriodKeys.join(', ')}.`; 
                            populatePeriodCheckboxes(); 
                            populateDepartmentFilterCheckboxes(); 
                            displayVisualSchedule(masterSchedule, allPeriodKeys); 
                        }
                    },
                    error: function(error, fileFromCallback) { 
                        displayError("PapaParse error: " + error.message); 
                        const fileNameForError = fileFromCallback ? fileFromCallback.name : (file ? file.name : "the selected file");
                        fileStatusP.textContent = `Error during parsing of ${fileNameForError}.`; 
                        masterSchedule = []; allPeriodKeys = []; allAvailableDepartments = new Set(); 
                    }
                });
            } catch (e) {
                displayError("A critical error occurred during file processing: " + e.message);
                fileStatusP.textContent = `Critical error processing ${file ? file.name : 'the file'}.`;
            }
        } else { 
            fileStatusP.textContent = 'No file selected.'; 
            masterSchedule = []; allPeriodKeys = []; allAvailableDepartments = new Set(); 
        }
    }

    function updateSubNameFields(type, count, container) { 
        if (!container) { console.error(`Container for ${type} sub name fields not found! Type: ${type}`); return; }
        container.innerHTML = ''; 
        if (count > 0) {
            let headerText = 'Enter Names for Subs (Optional):'; 
            const header = document.createElement('h5'); header.textContent = headerText;
            container.appendChild(header);
        }
        for (let i = 1; i <= count; i++) {
            const div = document.createElement('div');
            const label = document.createElement('label'); 
            label.htmlFor = `${type}SubName${i}`;
            let labelText = `Sub ${i} Name: `; 
            label.textContent = labelText;

            const input = document.createElement('input'); input.type = 'text';
            input.id = `${type}SubName${i}`; input.name = `${type}SubName${i}`;
            input.placeholder = `Sub ${i} Name`;
            if (type === 'preRoving') {
                input.addEventListener('focus', () => { 
                    if(preAssignRovingSubsUiDiv) preAssignRovingSubsUiDiv.style.opacity = '1';
                    if (preAssignmentSection) preAssignmentSection.style.opacity = '1';
                    if (proceedToAssignInitialRovingButton && proceedToAssignInitialRovingButton.style.display === 'none') {
                         if(finalizeExternalSubsAndProceedToInHouseButton) finalizeExternalSubsAndProceedToInHouseButton.style.display = 'none';
                         proceedToAssignInitialRovingButton.style.display = 'inline-block';
                        const numRoving = parseInt(numPreRovingSubsAvailableInput.value) || 0;
                        proceedToAssignInitialRovingButton.textContent = numRoving > 0 ? "Proceed to Assign Initial Roving Subs" : "Apply Dedicated Subs & Continue to In-House";
                    }
                });
            }
            div.appendChild(label); div.appendChild(input); container.appendChild(div);
        }
    }

    function getSubCustomNames(type, count) { 
        const names = {};
        for (let i = 1; i <= count; i++) {
            const inputField = document.getElementById(`${type}SubName${i}`);
            const defaultNameKey = `Sub ${i}`; 

            if (inputField && inputField.value.trim() !== '') { 
                names[defaultNameKey] = inputField.value.trim(); 
            } else { 
                names[defaultNameKey] = defaultNameKey; 
            }
        }
        return names;
    }

    function addCellClickListenersToTable() { 
        removeCellClickListenersFromTable(); 
        const cells = visualScheduleTableContainer.querySelectorAll('.schedule-table td.assignable-slot');
        cells.forEach(cell => { 
            if (cell.classList.contains('pd-affected-cell')) {
                const className = cell.dataset.class;
                if (className && className.toUpperCase() !== PREP_KEYWORD) { 
                    cell.classList.add('clickable-for-assignment');
                    cell.addEventListener('click', handleManualCellAssign); 
                }
            }
        });
    }
    function removeCellClickListenersFromTable() { 
         const cells = visualScheduleTableContainer.querySelectorAll('.schedule-table td.assignable-slot');
        cells.forEach(cell => { 
            cell.removeEventListener('click', handleManualCellAssign); 
            cell.classList.remove('clickable-for-assignment');
        });
    }

    function handleManualCellAssign(event) { 
        if (!isManualAssignModeActiveForRoving) return; 
        const cell = event.currentTarget;
        if (!cell.classList.contains('clickable-for-assignment')) return;

        const teacher = cell.dataset.teacher;
        const period = cell.dataset.period;
        const className = cell.dataset.class;

        if (!className || className.toUpperCase() === PREP_KEYWORD) return;
        
        const preAssignedDedSub = initialAnalysisData.preAssignedDedicatedSubsData[teacher];
        if (preAssignedDedSub) {
            alert(`${teacher} is already fully covered by ${preAssignedDedSub}. Cannot assign a roving sub here.`);
            return;
        }
        
        let currentCoverageDisplay = ""; 
        const existingDetailSpan = cell.querySelector('.coverage-detail');
        if (existingDetailSpan && (existingDetailSpan.textContent.includes('Sub:') || existingDetailSpan.textContent.includes('MRS:'))) { 
            currentCoverageDisplay = existingDetailSpan.textContent;
        }

        if (currentNumRovingSubsForManual <= 0 && !currentCoverageDisplay.startsWith('(Sub:') && !currentCoverageDisplay.startsWith('(MRS:')) { 
            alert("No roving subs available (as per input) to make new assignments for this phase."); return; 
        }

        let promptMessage = `Assign ${teacher}'s ${className} (${period}) to Sub:\n`; 
        for (let i = 1; i <= currentNumRovingSubsForManual; i++) { 
            const subIdKey = `Sub ${i}`; 
            promptMessage += `${i}: ${currentRovingSubCustomNamesForManual[subIdKey] || subIdKey}\n`; 
        }
        promptMessage += "0: Clear Manual Sub Assignment for this slot";
        const choice = prompt(promptMessage);
        if (choice === null) return; 
        const chosenRoverNum = parseInt(choice);

        for (const roverKey_iter in manualRovingAssignments) {
            if (manualRovingAssignments[roverKey_iter][period] && 
                manualRovingAssignments[roverKey_iter][period].teacher === teacher && 
                manualRovingAssignments[roverKey_iter][period].className === className) {
                delete manualRovingAssignments[roverKey_iter][period];
                if(Object.keys(manualRovingAssignments[roverKey_iter]).length === 0) delete manualRovingAssignments[roverKey_iter];
            }
        }
        
        if (chosenRoverNum > 0 && chosenRoverNum <= currentNumRovingSubsForManual) {
            const internalSubIdKeyForNew = `Sub ${chosenRoverNum}`; 
            const chosenSubActualName = currentRovingSubCustomNamesForManual[internalSubIdKeyForNew] || internalSubIdKeyForNew;
            const chosenSubDisplayNameForStorage = `MRS: ${chosenSubActualName}`; 
            const manualSubKeyForNew = `MRS-${chosenSubActualName.replace(/\s+/g, '_')}`; 

            if (manualRovingAssignments[manualSubKeyForNew] && manualRovingAssignments[manualSubKeyForNew][period]) {
                const oldAssignment = manualRovingAssignments[manualSubKeyForNew][period];
                if (oldAssignment.teacher !== teacher || oldAssignment.className !== className) {
                    const confirmationMessage = `'${chosenSubActualName}' is already covering ${oldAssignment.teacher}'s ${oldAssignment.className} during ${period}.\n\nDo you want to reassign them to cover ${teacher}'s ${className} instead?`;
                    
                    if (confirm(confirmationMessage)) {
                        delete manualRovingAssignments[manualSubKeyForNew][period];
                        const oldCell = visualScheduleTableContainer.querySelector(`td[data-teacher="${oldAssignment.teacher}"][data-period="${period}"][data-class="${oldAssignment.className}"]`);
                        if (oldCell) {
                            updateCellDisplayAfterManualRoving(oldCell, oldAssignment.teacher, period, oldAssignment.className); 
                        }
                        if (!manualRovingAssignments[manualSubKeyForNew]) manualRovingAssignments[manualSubKeyForNew] = {};
                        manualRovingAssignments[manualSubKeyForNew][period] = { teacher, className, period, subDisplayName: chosenSubDisplayNameForStorage };
                    } else {
                        updateCellDisplayAfterManualRoving(cell, teacher, period, className); 
                        return; 
                    }
                } else { 
                    if (!manualRovingAssignments[manualSubKeyForNew]) manualRovingAssignments[manualSubKeyForNew] = {};
                     manualRovingAssignments[manualSubKeyForNew][period] = { teacher, className, period, subDisplayName: chosenSubDisplayNameForStorage };
                }
            } else {
                if (!manualRovingAssignments[manualSubKeyForNew]) manualRovingAssignments[manualSubKeyForNew] = {};
                manualRovingAssignments[manualSubKeyForNew][period] = { teacher, className, period, subDisplayName: chosenSubDisplayNameForStorage };
            }
        }
        updateCellDisplayAfterManualRoving(cell, teacher, period, className);
    }
    
    function updateCellDisplayAfterManualRoving(cell, teacher, period, className) {
        cell.classList.remove('covered-by-manual-roving-visual', 'covered-by-roving-visual', 'covered-by-inhouse-visual', 'needs-coverage-visual', 'covered-by-dedicated-visual');
        const isPdTeacherSlot = (initialAnalysisData.pdTeachersFullObjects || []).some(pdt => pdt['Teacher Name'] === teacher) && 
                                ((initialAnalysisData.selectedPeriodsPerTeacher || {})[teacher] || []).includes(period);
        if (isPdTeacherSlot) cell.classList.add('pd-affected-cell');

        let detailSpan = cell.querySelector('.coverage-detail');
        if (!detailSpan) {
            detailSpan = document.createElement('span'); 
            detailSpan.className = 'coverage-detail';
            let originalClassSpan = cell.querySelector('.class-name-original');
            if(originalClassSpan) originalClassSpan.insertAdjacentElement('afterend', detailSpan);
            else cell.appendChild(detailSpan);
        }
        detailSpan.textContent = ''; 

        let coverageApplied = false;
        for (const roverKey_iter in manualRovingAssignments) { 
            if (manualRovingAssignments[roverKey_iter][period] && 
                manualRovingAssignments[roverKey_iter][period].teacher === teacher && 
                manualRovingAssignments[roverKey_iter][period].className === className) {
                
                cell.classList.add('covered-by-manual-roving-visual'); 
                let subName = manualRovingAssignments[roverKey_iter][period].subDisplayName.replace('MRS: ', '');
                detailSpan.textContent = `(Sub: ${subName})`; 
                cell.title = `Manually covered by Sub: ${subName}`;
                coverageApplied = true;
                break;
            }
        }

        if (!coverageApplied && isPdTeacherSlot && initialAnalysisData.preAssignedDedicatedSubsData[teacher]) {
            cell.classList.add('covered-by-dedicated-visual'); 
            const dedSubNameFromData = initialAnalysisData.preAssignedDedicatedSubsData[teacher]; 
            let displayText = dedSubNameFromData; 
            
            displayText = displayText.length > 20 ? displayText.substring(0,17) + '...' : displayText; 
            detailSpan.textContent = `(${displayText})`; 
            cell.title = `Covered by ${dedSubNameFromData.replace(/^Sub:\s*/,'')}`;
            coverageApplied = true;
        }
        
        if (!coverageApplied && isPdTeacherSlot) { 
             cell.classList.add('needs-coverage-visual');
             detailSpan.textContent = '(Needs Coverage)'; 
             cell.title = 'Needs Coverage';
        } else if (!coverageApplied) { 
             detailSpan.textContent = ''; 
             cell.title = className; 
        }
    }


    function clearAllOutputs() {
        if (periodsChecklistDiv) periodsChecklistDiv.innerHTML = '<p>Waiting for schedule upload...</p>';
        if (departmentChecklistForFilterDiv) departmentChecklistForFilterDiv.innerHTML = '<p>Waiting for schedule upload...</p>';
        if (teachersChecklistDiv) teachersChecklistDiv.innerHTML = '<p>Waiting for schedule upload or department filter selection...</p>';
        if (confirmPdTeachersButton) {
            confirmPdTeachersButton.style.display = 'none';
            confirmPdTeachersButton.textContent = "Confirm Teachers & Set Absence Periods"; 
        }

        if (teacherSpecificPdPeriodsSection) teacherSpecificPdPeriodsSection.style.display = 'none';
        if (teacherSpecificPeriodsChecklistDiv) teacherSpecificPeriodsChecklistDiv.innerHTML = '';
        
        if (preAssignmentSection) {
            preAssignmentSection.style.display = 'none';
            preAssignmentSection.style.opacity = '1'; 
        }
        if (preAssignDedicatedSubsList) preAssignDedicatedSubsList.innerHTML = '<p class="placeholder-text">Confirm PD teachers to see options.</p>';
        if (numPreRovingSubsAvailableInput) numPreRovingSubsAvailableInput.value = 0;
        if (preRovingSubNameFieldsContainer) preRovingSubNameFieldsContainer.innerHTML = '';
        if (proceedToAssignInitialRovingButton) {
            proceedToAssignInitialRovingButton.style.display = 'inline-block'; 
            proceedToAssignInitialRovingButton.disabled = true; 
            proceedToAssignInitialRovingButton.textContent = "Proceed to Assign Initial Roving Subs"; 
        }
        if(preAssignDedicatedSubsUiDiv) preAssignDedicatedSubsUiDiv.style.opacity = '1'; 
        if(preAssignRovingSubsUiDiv) preAssignRovingSubsUiDiv.style.opacity = '1';   

        if (manualInHouseAssignmentUI) {
            manualInHouseAssignmentUI.style.display = 'none';
            manualInHouseAssignmentUI.style.opacity = '1'; 
        }
        if (manualInHouseAssignmentsContainer) manualInHouseAssignmentsContainer.innerHTML = '<p class="placeholder-text">Confirm absent teachers and their periods to see assignment options here.</p>';
        
        if (finalizeExternalSubsAndProceedToInHouseButton) finalizeExternalSubsAndProceedToInHouseButton.style.display = 'none';
        if (coverClassesWithInHouseButton) {
            coverClassesWithInHouseButton.style.display = 'none';
            coverClassesWithInHouseButton.textContent = "Cover Classes!"; 
        }
        if (analyzeButton) analyzeButton.style.display = 'none'; 

        if (resultsSection) resultsSection.style.display = 'none';
        if (pdTeachersListUl) pdTeachersListUl.innerHTML = '';
        if (externalSubsNeededP) externalSubsNeededP.textContent = '--';
        if (coverageBreakdownDiv) coverageBreakdownDiv.innerHTML = '<p class="no-coverage">--</p>';
        if (finalSubsNeededSpan) finalSubsNeededSpan.textContent = '--';
        if (errorMessageDiv) errorMessageDiv.textContent = '';
        ['pdTeachersListHeading', 'overallExternalSubsHeading', 'initialCoverageBreakdownHeading', 'finalSubsNeededContainer'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        if(coverageBreakdownDiv) coverageBreakdownDiv.style.display = 'none';


        if (scenarioPlanningSection) scenarioPlanningSection.style.display = 'none';
        if (numDedicatedSubsToAssignInput) numDedicatedSubsToAssignInput.value = 0;
        if (assignDedicatedSubsToTeachersDiv) assignDedicatedSubsToTeachersDiv.innerHTML = '<p class="placeholder-text">Define additional dedicated subs to see assignment options.</p>';
        if (dedicatedSubNameFieldsContainer) dedicatedSubNameFieldsContainer.innerHTML = '';
        if (numRovingSubsAvailableInput) numRovingSubsAvailableInput.value = 0;
        if (rovingSubNameFieldsContainer) rovingSubNameFieldsContainer.innerHTML = '';
        if (scenarioResultsDiv) scenarioResultsDiv.innerHTML = '';
        if (manualRovingAssignModeButton) manualRovingAssignModeButton.style.display = 'none';
        if (manualAssignInfoDiv) manualAssignInfoDiv.style.display = 'none';
        if (finalizeManualAssignmentsButton) finalizeManualAssignmentsButton.style.display = 'none';

        if (printDownloadSection) printDownloadSection.style.display = 'none';
        
        if (visualScheduleTableContainer) visualScheduleTableContainer.innerHTML = '<p class="placeholder-text">Upload a schedule to see the visual display.</p>';

        masterSchedule = []; allPeriodKeys = []; allAvailableDepartments = new Set();
        selectedPdTeachersWithPeriods = {}; manualInHouseAssignments = {};
        initialAnalysisData = {
            pdTeachersFullObjects: [], selectedPeriodsPerTeacher: {}, classesNeedingCoverageOriginal: [],
            preAssignedDedicatedSubsData: {}, initialManualRovingAssignmentsData: {}, 
            coverageAfterExternalSubs: [], finalCoveragePlan: [],
            dedicatedSubCustomNames: {}, rovingSubCustomNames: {}
        };
        isManualAssignModeActiveForRoving = false; currentWorkingClassesForScenario = [];
        manualRovingAssignments = {}; currentNumRovingSubsForManual = 0;
        currentRovingSubCustomNamesForManual = {};
    }
    
    function clearResultsForNewAnalysisPhase() { 
        if (pdTeachersListUl) pdTeachersListUl.innerHTML = '';
        if (externalSubsNeededP) externalSubsNeededP.textContent = '--';
        if (coverageBreakdownDiv) coverageBreakdownDiv.innerHTML = '<p class="no-coverage">--</p>';
        if (finalSubsNeededSpan) finalSubsNeededSpan.textContent = '--';
        if (errorMessageDiv) errorMessageDiv.textContent = '';
        
        if (scenarioPlanningSection) scenarioPlanningSection.style.display = 'none';
        if (scenarioResultsDiv) scenarioResultsDiv.innerHTML = '';
        if (printDownloadSection) printDownloadSection.style.display = 'none';
        if (resultsSection) resultsSection.style.display = 'none'; 

        ['pdTeachersListHeading', 'overallExternalSubsHeading', 'initialCoverageBreakdownHeading', 'finalSubsNeededContainer'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        if(coverageBreakdownDiv) coverageBreakdownDiv.style.display = 'none';

    }

    function displayError(message) { if (errorMessageDiv) errorMessageDiv.textContent = message; console.error(message); }

    function updateVisualScheduleForPreAssignments() {
        const currentPdTeachers = Object.keys(selectedPdTeachersWithPeriods).map(name => masterSchedule.find(t => t['Teacher Name'] === name)).filter(Boolean);
        
        let tempSelectedPeriods = {};
        currentPdTeachers.forEach(t => {
            tempSelectedPeriods[t['Teacher Name']] = selectedPdTeachersWithPeriods[t['Teacher Name']] || [];
        });

        displayVisualSchedule(masterSchedule, allPeriodKeys, {
            pdTeachersFullObjects: currentPdTeachers,
            selectedPeriodsPerTeacher: tempSelectedPeriods,
            finalCoveragePlan: [] 
        });
    }

    function displayVisualSchedule(scheduleData, periodKeys, analysisDetails = {}) {
        if (!visualScheduleTableContainer) return;
        visualScheduleTableContainer.innerHTML = ''; 
        if (!scheduleData || scheduleData.length === 0 || !periodKeys || periodKeys.length === 0) { 
            visualScheduleTableContainer.innerHTML = '<p class="placeholder-text">Not enough data to display visual schedule.</p>'; return; 
        }
        
        const { 
            pdTeachersFullObjects = [], 
            selectedPeriodsPerTeacher = {}, 
            finalCoveragePlan = [], 
        } = analysisDetails;

        const pdTeacherNamesSet = new Set(pdTeachersFullObjects.map(t => t['Teacher Name']));
        const table = document.createElement('table'); table.className = 'schedule-table';
        const thead = table.createTHead(); const headerRow = thead.insertRow();
        const thTeacher = document.createElement('th'); thTeacher.textContent = 'Teacher'; headerRow.appendChild(thTeacher);
        periodKeys.forEach(periodKey => { const th = document.createElement('th'); th.textContent = periodKey; headerRow.appendChild(th); });
        const tbody = table.createTBody();

        scheduleData.forEach(teacherRow => {
            const tr = tbody.insertRow(); const teacherName = teacherRow['Teacher Name'];
            const tdTeacher = tr.insertCell(); tdTeacher.textContent = teacherName;
            
            if (pdTeacherNamesSet.has(teacherName)) { 
                tr.classList.add('pd-teacher-row'); 
            }

            periodKeys.forEach(periodKey => {
                const tdPeriod = tr.insertCell(); 
                const classAssignment = teacherRow[periodKey] || '';
                let cellContentHTML = `<span class="class-name-original">${classAssignment}</span>`;
                tdPeriod.dataset.teacher = teacherName; 
                tdPeriod.dataset.period = periodKey; 
                tdPeriod.dataset.class = classAssignment;
                
                tdPeriod.className = ''; 
                if (classAssignment.toUpperCase() === PREP_KEYWORD) { 
                    tdPeriod.classList.add('is-prep'); 
                } else if (classAssignment) { 
                    tdPeriod.classList.add('class-slot', 'assignable-slot'); 
                }

                const isPdTeacherCurrentSlot = pdTeacherNamesSet.has(teacherName);
                const teacherSpecificPdPeriods = selectedPeriodsPerTeacher[teacherName] || []; 
                const isPdPeriodForThisTeacherSlot = teacherSpecificPdPeriods.includes(periodKey);
                
                if (isPdTeacherCurrentSlot && isPdPeriodForThisTeacherSlot) { 
                    tdPeriod.classList.add('pd-affected-cell');
                    if (classAssignment.toUpperCase() === PREP_KEYWORD) { 
                        tdPeriod.classList.add('prep-during-pd'); 
                    }
                }
                
                const coverageInfo = finalCoveragePlan.find(slot => 
                    slot.pdTeacherName === teacherName && 
                    slot.period === periodKey && 
                    slot.className === classAssignment
                );
                
                let appliedCoverage = false;
                if (coverageInfo && coverageInfo.coveredBy) { 
                    appliedCoverage = true;
                    let coverageText = coverageInfo.coveredBy; 
                    let titleText = `Covered by ${coverageInfo.coveredBy.replace(/^(MRS:\s*|Sub:\s*|Staff:\s*)/, '')}`; 
                    
                    if (coverageText.startsWith('Staff:')) {  
                        tdPeriod.classList.add('covered-by-inhouse-visual'); 
                    } else if (coverageText.startsWith('MRS:')) { 
                        tdPeriod.classList.add('covered-by-manual-roving-visual'); 
                        coverageText = coverageText.replace('MRS:', 'Sub:'); 
                    } else if (coverageText.startsWith('Sub:')) { 
                        let isPreAssigned = initialAnalysisData.preAssignedDedicatedSubsData && 
                                            initialAnalysisData.preAssignedDedicatedSubsData[teacherName] === coverageInfo.coveredBy;
                        let isScenarioDedicated = initialAnalysisData.dedicatedSubCustomNames && 
                                                Object.values(initialAnalysisData.dedicatedSubCustomNames).map(n => `Sub: ${n}`).includes(coverageInfo.coveredBy);
                        
                        if(isPreAssigned || isScenarioDedicated){
                             tdPeriod.classList.add('covered-by-dedicated-visual');
                        } else {
                             tdPeriod.classList.add('covered-by-roving-visual'); 
                        }
                    }
                    
                    cellContentHTML += `<span class="coverage-detail">(${coverageText})</span>`; 
                    tdPeriod.title = titleText;
                } else if (coverageInfo && !coverageInfo.coveredBy) { 
                     appliedCoverage = true;
                     tdPeriod.classList.add('needs-coverage-visual'); 
                     tdPeriod.title = 'Needs Coverage'; 
                     cellContentHTML += `<span class="coverage-detail">(Needs Coverage)</span>`; 
                }

                if (!appliedCoverage && isPdTeacherCurrentSlot && isPdPeriodForThisTeacherSlot && classAssignment && classAssignment.toUpperCase() !== PREP_KEYWORD) {
                    if (initialAnalysisData.preAssignedDedicatedSubsData && initialAnalysisData.preAssignedDedicatedSubsData[teacherName]) {
                        tdPeriod.classList.add('covered-by-dedicated-visual');
                        const dedSubName = initialAnalysisData.preAssignedDedicatedSubsData[teacherName]; 
                        let displayText = dedSubName; 
                        
                        displayText = displayText.length > 20 ? displayText.substring(0,17) + '...' : displayText; 
                        cellContentHTML += `<span class="coverage-detail">(${displayText})</span>`; 
                        tdPeriod.title = `Covered by ${dedSubName.replace(/^Sub:\s*/,'')}`;
                        appliedCoverage = true; 
                    }
                }

                if (!appliedCoverage && isPdTeacherCurrentSlot && isPdPeriodForThisTeacherSlot && classAssignment && classAssignment.toUpperCase() !== PREP_KEYWORD) {
                     tdPeriod.classList.add('needs-coverage-visual'); 
                     tdPeriod.title = 'Needs Coverage'; 
                     cellContentHTML += `<span class="coverage-detail">(Needs Coverage)</span>`; 
                }

                tdPeriod.innerHTML = cellContentHTML;
            });
        });
        visualScheduleTableContainer.appendChild(table);
        
        if (isManualAssignModeActiveForRoving) { 
            updateVisualScheduleForManualRovingMode(true); 
        } 
    }
    
    function populatePeriodCheckboxes() { 
        if (!periodsChecklistDiv) return;
        periodsChecklistDiv.innerHTML = ''; 
        if (allPeriodKeys.length > 0) {
            allPeriodKeys.forEach(periodKey => {
                const label = document.createElement('label'); const checkbox = document.createElement('input');
                checkbox.type = 'checkbox'; checkbox.name = 'pdPeriod'; checkbox.value = periodKey; checkbox.checked = false; 
                label.appendChild(checkbox); label.appendChild(document.createTextNode(periodKey));
                periodsChecklistDiv.appendChild(label);
            });
        } else { periodsChecklistDiv.innerHTML = '<p>No periods found in schedule.</p>'; }
    }
    
    function populateDepartmentFilterCheckboxes() { 
        if (!departmentChecklistForFilterDiv) return;
        departmentChecklistForFilterDiv.innerHTML = '';
        const departmentCheckboxes = []; 
        if (allAvailableDepartments.size > 0) {
            const allLabel = document.createElement('label'); const allCheckbox = document.createElement('input');
            allCheckbox.type = 'checkbox'; allCheckbox.id = 'allDeptsFilterCheckbox'; allCheckbox.value = 'ALL_DEPARTMENTS'; 
            allCheckbox.checked = false; 

            allCheckbox.addEventListener('change', (event) => { 
                departmentCheckboxes.forEach(cb => cb.checked = event.target.checked); 
                populateTeacherCheckboxes(); 
            });
            allLabel.appendChild(allCheckbox); allLabel.appendChild(document.createTextNode('All Departments'));
            departmentChecklistForFilterDiv.appendChild(allLabel);

            Array.from(allAvailableDepartments).sort().forEach(dept => { 
                const label = document.createElement('label'); const checkbox = document.createElement('input');
                checkbox.type = 'checkbox'; checkbox.name = 'deptFilter'; checkbox.value = dept; 
                checkbox.checked = false; 
                checkbox.addEventListener('change', () => {
                    if (!checkbox.checked) { 
                        allCheckbox.checked = false; 
                    } else { 
                        if (departmentCheckboxes.every(cb => cb.checked)) { 
                            allCheckbox.checked = true; 
                        }
                    }
                    populateTeacherCheckboxes();
                });
                departmentCheckboxes.push(checkbox); label.appendChild(checkbox); label.appendChild(document.createTextNode(dept));
                departmentChecklistForFilterDiv.appendChild(label);
            });
        } else { departmentChecklistForFilterDiv.innerHTML = '<p>No departments found in schedule.</p>'; }
        populateTeacherCheckboxes(); 
    }

    function populateTeacherCheckboxes() { 
        if (!teachersChecklistDiv) return;
        teachersChecklistDiv.innerHTML = '';
        const allDeptsCheckbox = document.getElementById('allDeptsFilterCheckbox');
        let selectedDeptValues = [];

        if (allDeptsCheckbox && allDeptsCheckbox.checked) { 
            selectedDeptValues = Array.from(allAvailableDepartments); 
            selectedDeptValues.push(undefined, ''); 
        } else { 
            selectedDeptValues = Array.from(departmentChecklistForFilterDiv.querySelectorAll('input[name="deptFilter"]:checked')).map(cb => cb.value);
        }

        if (selectedDeptValues.length === 0 && !(allDeptsCheckbox && allDeptsCheckbox.checked)) {
             teachersChecklistDiv.innerHTML = '<p>Please select one or more departments to filter teachers.</p>';
             if (teachersChecklistDiv.parentElement) teachersChecklistDiv.parentElement.dispatchEvent(new Event('change')); 
             return;
        }

        const teachersToDisplay = masterSchedule.filter(teacher => 
            selectedDeptValues.includes(teacher.Department) || 
            (selectedDeptValues.some(v => v === undefined || v === '') && (!teacher.Department || teacher.Department.trim() === ''))
        ).sort((a,b) => a['Teacher Name'].localeCompare(b['Teacher Name'])); 

        if (teachersToDisplay.length > 0) {
            teachersToDisplay.forEach((teacher) => {
                const teacherName = teacher['Teacher Name']; const department = teacher['Department'] || 'N/A'; if (!teacherName) return;
                const label = document.createElement('label'); const checkbox = document.createElement('input');
                checkbox.type = 'checkbox'; checkbox.name = 'pdTeacher'; checkbox.value = teacherName;
                if (selectedPdTeachersWithPeriods.hasOwnProperty(teacherName)) { 
                    checkbox.checked = true; 
                } 
                label.appendChild(checkbox); label.appendChild(document.createTextNode(`${teacherName} (${department})`));
                teachersChecklistDiv.appendChild(label);
            });
        } else { 
            teachersChecklistDiv.innerHTML = '<p>No teachers match current department filter(s).</p>'; 
        }
        if (teachersChecklistDiv.parentElement) teachersChecklistDiv.parentElement.dispatchEvent(new Event('change'));    
    }

    function populateTeacherSpecificPeriodsUI() {
        if (!teacherSpecificPeriodsChecklistDiv) return;
        teacherSpecificPeriodsChecklistDiv.innerHTML = ''; 

        const confirmedTeacherNames = Object.keys(selectedPdTeachersWithPeriods);
        if (confirmedTeacherNames.length === 0) {
            if (teacherSpecificPdPeriodsSection) teacherSpecificPdPeriodsSection.style.display = 'none';
            teacherSpecificPeriodsChecklistDiv.innerHTML = '<p class="placeholder-text">No teachers confirmed for PD.</p>'; 
            return;
        }
        if (teacherSpecificPdPeriodsSection) {
             teacherSpecificPdPeriodsSection.style.display = 'block';
             const customizeSectionTitle = teacherSpecificPdPeriodsSection.querySelector('h3');
             if(customizeSectionTitle) customizeSectionTitle.textContent = "Confirm Absences";
        }

        confirmedTeacherNames.sort().forEach(teacherName => {
            const teacherObject = masterSchedule.find(t => t['Teacher Name'] === teacherName);
            if (teacherObject) {
                addTeacherToCustomizationUI(teacherObject, selectedPdTeachersWithPeriods[teacherName]);
            }
        });
        if (teacherSpecificPeriodsChecklistDiv.children.length === 0 && confirmedTeacherNames.length > 0) {
            teacherSpecificPeriodsChecklistDiv.innerHTML = '<p class="placeholder-text">Error populating teacher period customizations.</p>';
        } else if (confirmedTeacherNames.length === 0 && !teacherSpecificPeriodsChecklistDiv.querySelector('.placeholder-text')) {
             teacherSpecificPeriodsChecklistDiv.innerHTML = '<p class="placeholder-text">No teachers confirmed for PD.</p>';
        }
    }
    
    function getSelectedPdPeriods() { return Array.from(periodsChecklistDiv.querySelectorAll('input[name="pdPeriod"]:checked')).map(cb => cb.value); }
    
    function populatePreAssignDedicatedSubsUI() {
        if (!preAssignDedicatedSubsList) return;
        preAssignDedicatedSubsList.innerHTML = ''; 
         const placeholder = document.createElement('p');
         placeholder.className = 'placeholder-text';
         placeholder.textContent = 'No PD teachers selected or remaining.';

        const confirmedTeacherNames = Object.keys(selectedPdTeachersWithPeriods);
        if (confirmedTeacherNames.length === 0) {
             preAssignDedicatedSubsList.appendChild(placeholder);
             if (preAssignmentSection) preAssignmentSection.style.display = 'none'; 
             return;
        }
        
        confirmedTeacherNames.sort().forEach(teacherName => {
            const teacherObject = masterSchedule.find(t => t['Teacher Name'] === teacherName);
            if(teacherObject) addTeacherToPreAssignDedicatedUI(teacherObject);
        });

         if (preAssignDedicatedSubsList.children.length === 0 && confirmedTeacherNames.length > 0) { 
            preAssignDedicatedSubsList.appendChild(placeholder); 
        } else if (confirmedTeacherNames.length === 0 && !preAssignDedicatedSubsList.querySelector('.placeholder-text')) {
             preAssignDedicatedSubsList.innerHTML = '<p class="placeholder-text">No PD teachers selected or remaining.</p>';
        }
    }
    
    function populateDedicatedSubAssignmentUI(pdTeachersForScenario) { 
        if (!assignDedicatedSubsToTeachersDiv) return;
        assignDedicatedSubsToTeachersDiv.innerHTML = '';
        const numToAssign = parseInt(numDedicatedSubsToAssignInput.value) || 0; 
        
        if (pdTeachersForScenario.length === 0 && numToAssign > 0) { assignDedicatedSubsToTeachersDiv.innerHTML = '<p class="error">No PD teachers (without pre-assigned dedicated subs) available for SCENARIO assignment.</p>'; return; }
        if (numToAssign < 0) { assignDedicatedSubsToTeachersDiv.innerHTML = '<p class="error">Number of dedicated subs cannot be negative.</p>'; return; }
        if (numToAssign === 0) { assignDedicatedSubsToTeachersDiv.innerHTML = '<p><em>No additional external subs will be assigned to specific teachers in this scenario.</em></p>'; return; }
        
        let teacherChecklistHTML = `<p>Select up to ${numToAssign} teacher(s) for an <strong>additional external sub</strong>:</p>`;
        if (pdTeachersForScenario.length > 0) {
            pdTeachersForScenario.forEach(teacher => {
                teacherChecklistHTML += `
                    <label>
                        <input type="checkbox" name="teacherGetsDedicatedSub" value="${teacher['Teacher Name']}">
                        ${teacher['Teacher Name']} (${teacher.Department || 'N/A'})
                    </label>
                `;
            });
        } else {
             teacherChecklistHTML = `<p>No teachers available/left to assign additional external subs to.</p>`;
        }
        assignDedicatedSubsToTeachersDiv.innerHTML = teacherChecklistHTML;
        const checkboxes = assignDedicatedSubsToTeachersDiv.querySelectorAll('input[name="teacherGetsDedicatedSub"]');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                const checkedCount = assignDedicatedSubsToTeachersDiv.querySelectorAll('input[name="teacherGetsDedicatedSub"]:checked').length;
                if (checkedCount > numToAssign) {
                    alert(`You can only assign ${numToAssign} additional external sub(s) to teachers.`);
                    cb.checked = false;
                }
            });
        });
    }

    function populateManualInHouseAssignmentUI(classesStillNeedingCoverage = []) {
        if (!manualInHouseAssignmentsContainer || !manualInHouseAssignmentUI) return;
        manualInHouseAssignmentsContainer.innerHTML = ''; 
        let contentAdded = false;
        manualInHouseAssignments = {}; 

        if (classesStillNeedingCoverage.length === 0) {
             manualInHouseAssignmentsContainer.innerHTML = '<p class="placeholder-text">All classes appear covered by external subs, or no classes were initially identified as needing cover.</p>';
             return;
        }
        
        const tempInHouseUsageByPeriod = {}; 

        classesStillNeedingCoverage.forEach(slotToCover => {
            const pdTeacherName = slotToCover.pdTeacherName;
            const periodKey = slotToCover.period;
            const className = slotToCover.className;
            const slotIdentifier = `${pdTeacherName}_${periodKey}_${className.replace(/\s+/g, '-')}`;
            
            let slotHTML = `<div class="manual-in-house-slot" data-period="${periodKey}">
                                <p class="slot-info">Cover for: <strong>${pdTeacherName}</strong> - ${className} (${periodKey})</p>
                                <div class="available-teachers-list">`;
            
            let availableCoveringTeachers = [];
            masterSchedule.forEach(potentialCoverTeacher => {
                const potentialCoverTeacherName = potentialCoverTeacher['Teacher Name'];
                if (potentialCoverTeacherName === pdTeacherName) return; 

                const isCoverTeacherAbsent = (initialAnalysisData.pdTeachersFullObjects || []).some(pdt => 
                    pdt['Teacher Name'] === potentialCoverTeacherName &&
                    ((initialAnalysisData.selectedPeriodsPerTeacher || {})[potentialCoverTeacherName] || []).includes(periodKey)
                );
                if (isCoverTeacherAbsent) return;

                if (potentialCoverTeacher[periodKey] && potentialCoverTeacher[periodKey].toUpperCase() === PREP_KEYWORD) {
                    availableCoveringTeachers.push(potentialCoverTeacherName);
                }
            });

            slotHTML += `<label><input type="radio" name="manualInHouse_${slotIdentifier}" value="${NO_IN_HOUSE_COVER_KEYWORD}" data-teacher-name-value=""> None</label>`; 
            slotHTML += `<label><input type="radio" name="manualInHouse_${slotIdentifier}" value="${AUTOMATIC_IN_HOUSE_KEYWORD}" data-teacher-name-value="AUTOMATIC" checked> Automatic</label>`; 

            if (availableCoveringTeachers.length > 0) {
                availableCoveringTeachers.sort().forEach(coverTeacherName => {
                    const isDisabled = tempInHouseUsageByPeriod[periodKey] && tempInHouseUsageByPeriod[periodKey].includes(coverTeacherName);
                    slotHTML += `<label class="${isDisabled ? 'disabled-in-house-option' : ''}">
                                    <input type="radio" 
                                           name="manualInHouse_${slotIdentifier}" 
                                           value="${coverTeacherName}" 
                                           data-teacher-name-value="${coverTeacherName}"
                                           ${isDisabled ? 'disabled' : ''}> 
                                    ${coverTeacherName} ${isDisabled ? '(Already covering in this period)' : ''}
                                 </label>`;
                });
            } else {
                slotHTML += `<p style="padding-left:20px;"><em>No staff with PREP found for this period.</em></p>`;
            }
            slotHTML += `</div></div>`;
            manualInHouseAssignmentsContainer.innerHTML += slotHTML;
            contentAdded = true;
        });
        
        if (contentAdded) {
            manualInHouseAssignmentsContainer.querySelectorAll('input[type="radio"]').forEach(radio => {
                radio.addEventListener('focus', () => { 
                    if (manualInHouseAssignmentUI) manualInHouseAssignmentUI.style.opacity = '1';
                    if (coverClassesWithInHouseButton && coverClassesWithInHouseButton.disabled){ 
                        coverClassesWithInHouseButton.disabled = false;
                    }
                });
                radio.addEventListener('change', handleManualInHouseAssignmentChange);
            });
        } else if (classesStillNeedingCoverage.length > 0) { 
             manualInHouseAssignmentsContainer.innerHTML = '<p class="placeholder-text">Error generating in-house options.</p>';
        }
    }

    function handleManualInHouseAssignmentChange(event) {
        const changedRadio = event.target;
        const slotIdentifier = changedRadio.name.replace('manualInHouse_', '');
        const selectedValue = changedRadio.value; 
        const periodOfAssignment = changedRadio.closest('.manual-in-house-slot').dataset.period;

        if (changedRadio.checked) {
            if (selectedValue === NO_IN_HOUSE_COVER_KEYWORD || selectedValue === AUTOMATIC_IN_HOUSE_KEYWORD ) { 
                manualInHouseAssignments[slotIdentifier] = selectedValue; 
            } else if (selectedValue === "") { 
                 manualInHouseAssignments[slotIdentifier] = AUTOMATIC_IN_HOUSE_KEYWORD; 
            }
            else { 
                manualInHouseAssignments[slotIdentifier] = selectedValue;
            }
        }
        if (manualInHouseAssignmentUI) manualInHouseAssignmentUI.style.opacity = '1'; 
        if (coverClassesWithInHouseButton) coverClassesWithInHouseButton.disabled = false; 


        const allSlotsInSamePeriod = manualInHouseAssignmentsContainer.querySelectorAll(`.manual-in-house-slot[data-period="${periodOfAssignment}"]`);
        
        const teachersUsedThisPeriod = new Set();
        allSlotsInSamePeriod.forEach(slotDiv => {
            const radiosInSlot = slotDiv.querySelectorAll('input[type="radio"]');
            radiosInSlot.forEach(r => {
                if (r.checked && r.value !== "" && r.value !== AUTOMATIC_IN_HOUSE_KEYWORD && r.value !== NO_IN_HOUSE_COVER_KEYWORD) {
                    teachersUsedThisPeriod.add(r.value); 
                }
            });
        });
        
        allSlotsInSamePeriod.forEach(slotDiv => {
            const radiosInSlot = slotDiv.querySelectorAll('input[type="radio"][data-teacher-name-value]'); 
            radiosInSlot.forEach(r => {
                const teacherNameValue = r.dataset.teacherNameValue;
                if (teacherNameValue === "" || teacherNameValue === AUTOMATIC_IN_HOUSE_KEYWORD || teacherNameValue === NO_IN_HOUSE_COVER_KEYWORD) return; 

                const isCurrentlySelectedForThisSlot = r.checked && r.value === teacherNameValue;

                if (teachersUsedThisPeriod.has(teacherNameValue) && !isCurrentlySelectedForThisSlot) {
                    r.disabled = true;
                    r.parentElement.classList.add('disabled-in-house-option'); 
                    let title = r.parentElement.title || '';
                    if (!title.includes('Already covering')) {
                         r.parentElement.title = (title ? title + " " : "") + `(${teacherNameValue} is already covering another class in ${periodOfAssignment}.)`;
                    }
                } else {
                    r.disabled = false;
                    r.parentElement.classList.remove('disabled-in-house-option');
                     r.parentElement.title = (r.parentElement.title || '').replace(/\(.*is already covering.*\)/g, '').trim();
                }
            });
        });
    }
    
    function handleFinalizeExternalSubsAndProceedToInHouse() {
        clearResultsForNewAnalysisPhase(); 
        if (visualScheduleTableContainer) visualScheduleTableContainer.innerHTML = '<p class="placeholder-text">Processing external subs...</p>'; 
        
        initialAnalysisData.initialManualRovingAssignmentsData = JSON.parse(JSON.stringify(manualRovingAssignments));

        isManualAssignModeActiveForRoving = false; 
        updateVisualScheduleForManualRovingMode(false);
        if (manualAssignInfoDiv) manualAssignInfoDiv.style.display = 'none';
        if (preAssignmentSection) preAssignmentSection.style.opacity = '0.7'; 
        if (finalizeExternalSubsAndProceedToInHouseButton) finalizeExternalSubsAndProceedToInHouseButton.disabled = true;

        const currentPdTeacherNames = Object.keys(selectedPdTeachersWithPeriods); 
        initialAnalysisData.pdTeachersFullObjects = currentPdTeacherNames.map(name => masterSchedule.find(t => t['Teacher Name'] === name)).filter(Boolean);
        initialAnalysisData.selectedPeriodsPerTeacher = JSON.parse(JSON.stringify(selectedPdTeachersWithPeriods));

        let classesToCoverThisRun = [];
        initialAnalysisData.pdTeachersFullObjects.forEach(pdTeacher => {
            const teacherName = pdTeacher['Teacher Name'];
            const absencePeriods = initialAnalysisData.selectedPeriodsPerTeacher[teacherName] || [];
            absencePeriods.forEach(periodKey => {
                const classAssignment = pdTeacher[periodKey];
                if (classAssignment && classAssignment.toUpperCase() !== PREP_KEYWORD) {
                    classesToCoverThisRun.push({
                        pdTeacherName: teacherName, pdTeacherDept: pdTeacher.Department || 'N/A',
                        period: periodKey, className: classAssignment, coveredBy: null 
                    });
                }
            });
        });
        initialAnalysisData.classesNeedingCoverageOriginal = JSON.parse(JSON.stringify(classesToCoverThisRun));

        let coverageAfterExternal = JSON.parse(JSON.stringify(classesToCoverThisRun));

        coverageAfterExternal.forEach(classSlot => {
            if (initialAnalysisData.preAssignedDedicatedSubsData[classSlot.pdTeacherName]) {
                let dedSubName = initialAnalysisData.preAssignedDedicatedSubsData[classSlot.pdTeacherName];
                // Ensure "Sub:" prefix for display consistency, if not already correctly formatted
                if (!dedSubName.startsWith("Sub: ")) { // This check might be redundant if addTeacherToPreAssignDedicatedUI is strict
                    dedSubName = `Sub: ${dedSubName.replace(/^DS for |^DS: /,'')}`; // Clean up older DS formats too
                }
                classSlot.coveredBy = dedSubName;
            }
        });

        for (const roverKey in initialAnalysisData.initialManualRovingAssignmentsData) { 
            for (const periodKey in initialAnalysisData.initialManualRovingAssignmentsData[roverKey]) {
                const assignment = initialAnalysisData.initialManualRovingAssignmentsData[roverKey][periodKey]; 
                const classSlot = coverageAfterExternal.find(c => 
                    !c.coveredBy && 
                    c.pdTeacherName === assignment.teacher && 
                    c.period === periodKey && 
                    c.className === assignment.className
                );
                if (classSlot) {
                    let subDisplayName = assignment.subDisplayName; // Should be "MRS: Name" from internal storage
                    if(subDisplayName.startsWith("MRS: ")) subDisplayName = subDisplayName.replace("MRS: ", "Sub: "); // Convert for plan display
                    else if (!subDisplayName.startsWith("Sub: ")) subDisplayName = `Sub: ${subDisplayName}`; // Ensure prefix
                    classSlot.coveredBy = subDisplayName; 
                }
            }
        }
        initialAnalysisData.coverageAfterExternalSubs = coverageAfterExternal; 

        displayVisualSchedule(masterSchedule, allPeriodKeys, {
            pdTeachersFullObjects: initialAnalysisData.pdTeachersFullObjects,
            selectedPeriodsPerTeacher: initialAnalysisData.selectedPeriodsPerTeacher,
            finalCoveragePlan: coverageAfterExternal 
        });
        
        const slotsStillNeedingInHouse = coverageAfterExternal.filter(c => !c.coveredBy);
        if (manualInHouseAssignmentUI) {
            manualInHouseAssignmentUI.style.display = 'block';
            manualInHouseAssignmentUI.style.opacity = '1'; 
        }
        populateManualInHouseAssignmentUI(slotsStillNeedingInHouse); 
        if (coverClassesWithInHouseButton) {
            coverClassesWithInHouseButton.style.display = 'inline-block';
            coverClassesWithInHouseButton.disabled = false;
        }
    }

    function handleCoverClassesWithInHouse() {
        if (visualScheduleTableContainer) visualScheduleTableContainer.innerHTML = '<p class="placeholder-text">Processing in-house coverage and finalizing...</p>'; 
        if (coverClassesWithInHouseButton) coverClassesWithInHouseButton.disabled = true;
        if (manualInHouseAssignmentUI) manualInHouseAssignmentUI.style.opacity = '0.7';


        let finalCoveragePlan = JSON.parse(JSON.stringify(initialAnalysisData.coverageAfterExternalSubs));
        let internalCoverTeacherUsage = {};

        finalCoveragePlan.forEach(classToCover => { 
            if (classToCover.coveredBy) return; 

            const slotIdentifier = `${classToCover.pdTeacherName}_${classToCover.period}_${classToCover.className.replace(/\s+/g, '-')}`;
            const manualChoice = manualInHouseAssignments[slotIdentifier];

            if (manualChoice && manualChoice !== AUTOMATIC_IN_HOUSE_KEYWORD && manualChoice !== NO_IN_HOUSE_COVER_KEYWORD) {
                const coveringTeacherName = manualChoice;
                if (!(internalCoverTeacherUsage[classToCover.period] && internalCoverTeacherUsage[classToCover.period].includes(coveringTeacherName))) {
                     classToCover.coveredBy = `Staff: ${coveringTeacherName}`;
                     if (!internalCoverTeacherUsage[classToCover.period]) internalCoverTeacherUsage[classToCover.period] = [];
                     internalCoverTeacherUsage[classToCover.period].push(coveringTeacherName);
                } else {
                    console.warn(`Conflict: ${coveringTeacherName} already assigned manually in period ${classToCover.period}. Slot for ${classToCover.pdTeacherName} not covered by this manual choice.`);
                }
            }
        });

        findAndAssignAutomaticInHouseCoverage(
            finalCoveragePlan.filter(c => {
                if (c.coveredBy) return false; 
                const slotIdentifier = `${c.pdTeacherName}_${c.period}_${c.className.replace(/\s+/g, '-')}`;
                return manualInHouseAssignments[slotIdentifier] === AUTOMATIC_IN_HOUSE_KEYWORD || 
                       manualInHouseAssignments[slotIdentifier] === undefined; 
            }),
            masterSchedule, 
            allPeriodKeys, 
            internalCoverTeacherUsage, 
            initialAnalysisData.selectedPeriodsPerTeacher 
        );
        
        initialAnalysisData.finalCoveragePlan = finalCoveragePlan; 

        if(resultsSection) resultsSection.style.display = 'block';
        if(pdTeachersListUl && initialAnalysisData.pdTeachersFullObjects.length > 0) {
            pdTeachersListUl.innerHTML = initialAnalysisData.pdTeachersFullObjects.map(t => {
                const periods = initialAnalysisData.selectedPeriodsPerTeacher[t['Teacher Name']] || [];
                return `<li>${t['Teacher Name']} (${t.Department || 'N/A'}) - Absent for periods: ${periods.length > 0 ? periods.join(', ') : 'None Selected'}</li>`;
            }).join('');
            document.getElementById('pdTeachersListHeading').style.display = 'block';
            pdTeachersListUl.style.display = 'block';
        } else {
             document.getElementById('pdTeachersListHeading').style.display = 'none';
             if(pdTeachersListUl) pdTeachersListUl.style.display = 'none';
        }

        displayVisualSchedule(masterSchedule, allPeriodKeys, {
            pdTeachersFullObjects: initialAnalysisData.pdTeachersFullObjects,
            selectedPeriodsPerTeacher: initialAnalysisData.selectedPeriodsPerTeacher,
            finalCoveragePlan: finalCoveragePlan
        });

        updateScenarioTextualSummary(finalCoveragePlan, { isScenario: false }); 
        if(coverageBreakdownDiv) coverageBreakdownDiv.style.display = 'block';
        document.getElementById('overallExternalSubsHeading').style.display = 'block';
        if(externalSubsNeededP) externalSubsNeededP.style.display = 'block';
        document.getElementById('initialCoverageBreakdownHeading').style.display = 'block';
        if(finalSubsNeededContainer) finalSubsNeededContainer.style.display = 'block';

        if (scenarioPlanningSection) scenarioPlanningSection.style.display = 'block';
        if (numDedicatedSubsToAssignInput) numDedicatedSubsToAssignInput.value = 0; 
        if (numRovingSubsAvailableInput) numRovingSubsAvailableInput.value = 0;
        
        const pdTeachersForScenarioDedicated = (initialAnalysisData.pdTeachersFullObjects || []).filter(
            teacher => !initialAnalysisData.preAssignedDedicatedSubsData.hasOwnProperty(teacher['Teacher Name'])
        );
        populateDedicatedSubAssignmentUI(pdTeachersForScenarioDedicated); 
        updateSubNameFields('dedicated', 0, dedicatedSubNameFieldsContainer); 
        updateSubNameFields('roving', 0, rovingSubNameFieldsContainer);    

        if (manualRovingAssignModeButton) manualRovingAssignModeButton.style.display = 'none'; 


        if (printDownloadSection) printDownloadSection.style.display = 'block';
    }

    
    function updateScenarioTextualSummary(coveragePlan, summaryDetails = {}) {
        const {
            isScenario = false, 
            numDedicatedSubsAssignedToTeachersScenario = 0, 
            numRovingSubsUtilizedScenario = 0,
            numRovingSubsInputScenario = 0,
            teachersAssignedDedicatedSubNamesFromScenario = [],
            dedicatedSubCustomNamesScenario = {}, 
            rovingSubCustomNamesScenario = {},   
            pdTeachersFullObjectsFromAnalysis = initialAnalysisData.pdTeachersFullObjects || [],
            classesOriginalFromAnalysis = initialAnalysisData.classesNeedingCoverageOriginal || [],
            preAssignedDedicatedSubs = initialAnalysisData.preAssignedDedicatedSubsData || {},
        } = summaryDetails;
    
        let summaryTextOutputTarget = isScenario ? scenarioResultsDiv : coverageBreakdownDiv;
        if (!summaryTextOutputTarget) return;
        summaryTextOutputTarget.innerHTML = ''; 
    
        let summaryTextOutput = '';
        let foundAnyCoverageInfoText = false;
        let summaryExternalSubTeachersStillNeedingCover = new Set(); 
    
        pdTeachersFullObjectsFromAnalysis.forEach(pdTeacher => {
            let teacherCoverageHtml = `<h4>Coverage for ${pdTeacher['Teacher Name']} (${pdTeacher.Department || 'N/A'}):</h4>`;
            const teacherPdPeriods = (initialAnalysisData.selectedPeriodsPerTeacher || {})[pdTeacher['Teacher Name']] || [];
            const originalClassesForThisTeacherDuringTheirPD = classesOriginalFromAnalysis.filter(
                c => c.pdTeacherName === pdTeacher['Teacher Name'] && teacherPdPeriods.includes(c.period)
            );
            let contentForThisTeacher = false;

            if (!isScenario && preAssignedDedicatedSubs[pdTeacher['Teacher Name']]) {
                let subName = preAssignedDedicatedSubs[pdTeacher['Teacher Name']]; 
                teacherCoverageHtml += `<p><em>Covered by pre-assigned <strong>${subName}</strong>.</em></p>`;
                contentForThisTeacher = true; foundAnyCoverageInfoText = true;
            }

            const inHouseCovers = coveragePlan.filter(c => c.pdTeacherName === pdTeacher['Teacher Name'] && c.coveredBy && c.coveredBy.startsWith('Staff:'));
            if (inHouseCovers.length > 0) {
                contentForThisTeacher = true; foundAnyCoverageInfoText = true;
                teacherCoverageHtml += '<ul>';
                inHouseCovers.forEach(c => { teacherCoverageHtml += `<li class="coverage-item">${c.coveredBy.replace('Staff: ','')} (Prep ${c.period}) covers ${c.className} (${c.period}).</li>`; });
                teacherCoverageHtml += '</ul>';
            }
            
            const externalSubCoverage = coveragePlan.filter(c => 
                c.pdTeacherName === pdTeacher['Teacher Name'] && c.coveredBy && 
                c.coveredBy.startsWith('Sub:') && 
                !preAssignedDedicatedSubs[pdTeacher['Teacher Name']] 
            );


            if (externalSubCoverage.length > 0) {
                contentForThisTeacher = true; foundAnyCoverageInfoText = true;
                teacherCoverageHtml += `<p><em>Assisted by External Sub(s):</em></p><ul>`;
                externalSubCoverage.forEach(c => {
                    let subDisplayName = c.coveredBy; 
                    teacherCoverageHtml += `<li class="coverage-item">${subDisplayName} covers ${c.className} (${c.period}).</li>`; 
                });
                teacherCoverageHtml += `</ul>`;
            }

            const stillUncovered = coveragePlan.filter(c => c.pdTeacherName === pdTeacher['Teacher Name'] && !c.coveredBy);
            if (stillUncovered.length > 0) {
                if (!(!isScenario && preAssignedDedicatedSubs[pdTeacher['Teacher Name']])) {
                    contentForThisTeacher = true; foundAnyCoverageInfoText = true;
                    summaryExternalSubTeachersStillNeedingCover.add(pdTeacher['Teacher Name']); 
                    let listItems = stillUncovered.map(uc => `<li class="uncovered-item">${uc.className} (${uc.period})</li>`).join('');
                    teacherCoverageHtml += `<p class="external-sub-item"><strong>Indicates need for an external substitute for:</strong></p><ul>${listItems}</ul>`;
                }
            }
            
            if (teacherPdPeriods.length === 0 && pdTeachersFullObjectsFromAnalysis.some(p=>p['Teacher Name'] === pdTeacher['Teacher Name'])) { 
                 teacherCoverageHtml += '<p><em>No absence periods selected for this teacher.</em></p>'; contentForThisTeacher = true; foundAnyCoverageInfoText = true;
            } else if (originalClassesForThisTeacherDuringTheirPD.length === 0 && teacherPdPeriods.length > 0) { 
                teacherCoverageHtml += '<p><em>No classes scheduled during their selected absence periods.</em></p>'; contentForThisTeacher = true; foundAnyCoverageInfoText = true;
            } else if (originalClassesForThisTeacherDuringTheirPD.length > 0 && !contentForThisTeacher && stillUncovered.length === 0 && inHouseCovers.length === 0 && externalSubCoverage.length === 0 ) { 
                if (!(!isScenario && preAssignedDedicatedSubs[pdTeacher['Teacher Name']])) { 
                    teacherCoverageHtml += '<p><em>All classes for this teacher during their absence periods appear covered or did not require coverage.</em></p>'; 
                    contentForThisTeacher = true; foundAnyCoverageInfoText = true;
                }
            }
            if(contentForThisTeacher) summaryTextOutput += teacherCoverageHtml;
        });
        
        if (!foundAnyCoverageInfoText && coveragePlan.length === 0 && pdTeachersFullObjectsFromAnalysis.length > 0 && classesOriginalFromAnalysis.length > 0 ) { 
            summaryTextOutput = '<p class="no-coverage">No coverage solutions found or needed based on current selections.</p>';
        } else if (pdTeachersFullObjectsFromAnalysis.length > 0 && classesOriginalFromAnalysis.length === 0 && !foundAnyCoverageInfoText ) {
            summaryTextOutput = '<p class="no-coverage">Selected teachers have no classes during their specified absence periods.</p>';
        } else if (pdTeachersFullObjectsFromAnalysis.length === 0 && !foundAnyCoverageInfoText) { 
             summaryTextOutput = '<p class="no-coverage">No teachers selected for absence.</p>';
        }


        if(isScenario){
            const additionalDedicatedSubsNeededCount = summaryExternalSubTeachersStillNeedingCover.size; 
            const totalExternalSubsForScenario = numDedicatedSubsAssignedToTeachersScenario + numRovingSubsUtilizedScenario + additionalDedicatedSubsNeededCount;
            
            let scenarioHeaderText = `<h4>Scenario: ${numDedicatedSubsAssignedToTeachersScenario} Additional Sub(s) (Dedicated) & ${numRovingSubsInputScenario} Additional Sub(s) (Roving) Available</h4>`;
            summaryTextOutputTarget.innerHTML = scenarioHeaderText + summaryTextOutput; 
            summaryTextOutputTarget.innerHTML += `<hr><p><strong>Scenario Summary:</strong></p><ul>
                                   <li>Additional Subs Assigned to Specific Teachers: ${numDedicatedSubsAssignedToTeachersScenario}</li>
                                   <li>Utilized Additional Roving Subs: ${numRovingSubsUtilizedScenario} (out of ${numRovingSubsInputScenario} available)</li>
                                   <li>Further External Subs Still Needed: ${additionalDedicatedSubsNeededCount}</li>
                                   <li><strong>Total Additional External Subs Indicated for this Scenario: ${totalExternalSubsForScenario}</strong></li></ul>`;
        } else { 
            if(coverageBreakdownDiv) coverageBreakdownDiv.innerHTML = summaryTextOutput;
            const initialSubsNeededCount = summaryExternalSubTeachersStillNeedingCover.size;
            if(finalSubsNeededSpan) finalSubsNeededSpan.textContent = initialSubsNeededCount;
            if(externalSubsNeededP) externalSubsNeededP.textContent = `${initialSubsNeededCount}`;
        }
    }
    
    function runScenarioAnalysis() { 
        manualRovingAssignments = {}; 
        isManualAssignModeActiveForRoving = false; 
        if(manualAssignInfoDiv) manualAssignInfoDiv.style.display = 'none';
        if(manualRovingAssignModeButton) manualRovingAssignModeButton.style.display = 'inline-block'; 
        if(finalizeManualAssignmentsButton) finalizeManualAssignmentsButton.style.display = 'none';
        if(visualScheduleTableContainer) visualScheduleTableContainer.innerHTML = '<p class="placeholder-text">Updating visual schedule for scenario...</p>';

        try {
            const { 
                pdTeachersFullObjects, 
                selectedPeriodsPerTeacher, 
                finalCoveragePlan, 
                preAssignedDedicatedSubsData,
            } = initialAnalysisData;

            if (!pdTeachersFullObjects || pdTeachersFullObjects.length === 0 || !finalCoveragePlan) { 
                displayError("Run initial coverage process ('Cover Classes!') first."); 
                if (scenarioResultsDiv) scenarioResultsDiv.innerHTML = '<p class="error">Run initial coverage process first.</p>'; 
                return; 
            }
            
            const numDedicatedSubsScenario = parseInt(numDedicatedSubsToAssignInput.value) || 0; 
            const teachersAssignedDedicatedScenario = Array.from(assignDedicatedSubsToTeachersDiv.querySelectorAll('input[name="teacherGetsDedicatedSub"]:checked')).map(cb => cb.value);
            const numRovingSubsScenario = parseInt(numRovingSubsAvailableInput.value) || 0; 

            if (teachersAssignedDedicatedScenario.length > numDedicatedSubsScenario) { 
                 alert(`You have selected ${teachersAssignedDedicatedScenario.length} teachers for additional subs, but specified only ${numDedicatedSubsScenario} additional subs are available.`);
                 if (scenarioResultsDiv) scenarioResultsDiv.innerHTML = `<p class="error">Mismatch for additional subs.</p>`; 
                 return; 
            }

            const dedicatedSubCustomNamesForScenario = getSubCustomNames('dedicated', numDedicatedSubsScenario); 
            const rovingSubCustomNamesForScenario = getSubCustomNames('roving', numRovingSubsScenario); 
            initialAnalysisData.dedicatedSubCustomNames = dedicatedSubCustomNamesForScenario; 
            initialAnalysisData.rovingSubCustomNames = rovingSubCustomNamesForScenario;    

            currentWorkingClassesForScenario = JSON.parse(JSON.stringify(finalCoveragePlan)); 
            
            let scenarioRovingSubSchedules = Array(numRovingSubsScenario).fill(null).map(() => ({ assignments: {}, count: 0, subName: '' })); 
            for(let i=0; i < numRovingSubsScenario; i++) {
                const subIdKey = `Sub ${i+1}`; 
                let subNameToUse = rovingSubCustomNamesForScenario[subIdKey] || subIdKey;
                if (!subNameToUse.startsWith('Sub: ')) subNameToUse = `Sub: ${subNameToUse}`;
                scenarioRovingSubSchedules[i].subName = subNameToUse;
            }

            teachersAssignedDedicatedScenario.forEach((teacherName, index) => {
                const subIdentifierKey = `Sub ${index + 1}`; 
                let subDisplayName = dedicatedSubCustomNamesForScenario[subIdentifierKey] || subIdentifierKey;
                if (!subDisplayName.startsWith('Sub: ')) subDisplayName = `Sub: ${subDisplayName}`;
                
                currentWorkingClassesForScenario.forEach(c => { 
                    if (c.pdTeacherName === teacherName && !preAssignedDedicatedSubsData[teacherName]) { 
                        if (c.coveredBy && (c.coveredBy.startsWith('Staff:') || c.coveredBy.startsWith('MRS:'))) { 
                            console.log(`Scenario: Sub ${subDisplayName} for ${teacherName} overrides previous cover: ${c.coveredBy} for class ${c.className} (${c.period})`);
                        }
                        c.coveredBy = subDisplayName; 
                    } 
                });
            });
            
            if (numRovingSubsScenario > 0) {
                let classesForScenarioAlgorithmicRoving = currentWorkingClassesForScenario.filter(c => 
                    !c.coveredBy || 
                    (c.coveredBy && c.coveredBy.startsWith('Staff:')) 
                ).sort((a, b) => (a.period < b.period) ? -1 : (a.period > b.period) ? 1 : (a.pdTeacherName < b.pdTeacherName) ? -1 : 1);
                
                for (const classToCover of classesForScenarioAlgorithmicRoving) {
                    if (classToCover.coveredBy && classToCover.coveredBy.startsWith('Staff:')) {
                        console.log(`Scenario: Roving sub potentially overriding Staff for ${classToCover.pdTeacherName}'s ${classToCover.className} (${classToCover.period})`);
                    }

                    for (let i = 0; i < numRovingSubsScenario; i++) {
                        if (!scenarioRovingSubSchedules[i].assignments[classToCover.period]) { 
                            classToCover.coveredBy = scenarioRovingSubSchedules[i].subName; 
                            scenarioRovingSubSchedules[i].assignments[classToCover.period] = { 
                                teacher: classToCover.pdTeacherName, className: classToCover.className 
                            };
                            scenarioRovingSubSchedules[i].count++;
                            break; 
                        }
                    }
                }
            }

            displayVisualSchedule(masterSchedule, allPeriodKeys, {
                pdTeachersFullObjects, 
                selectedPeriodsPerTeacher, 
                finalCoveragePlan: currentWorkingClassesForScenario 
            });
            
            const usedScenarioRovingSubsCount = scenarioRovingSubSchedules.filter(rs => rs.count > 0).length;
            
            updateScenarioTextualSummary(currentWorkingClassesForScenario, {
                isScenario: true,
                numDedicatedSubsAssignedToTeachersScenario: teachersAssignedDedicatedScenario.length, 
                numRovingSubsUtilizedScenario: usedScenarioRovingSubsCount,
                numRovingSubsInputScenario: numRovingSubsScenario,
                teachersAssignedDedicatedSubNamesFromScenario: teachersAssignedDedicatedScenario,
                dedicatedSubCustomNamesScenario: dedicatedSubCustomNamesForScenario, 
                rovingSubCustomNamesScenario: rovingSubCustomNamesForScenario,
                pdTeachersFullObjectsFromAnalysis: pdTeachersFullObjects,
                classesOriginalFromAnalysis: initialAnalysisData.classesNeedingCoverageOriginal, 
                preAssignedDedicatedSubs: preAssignedDedicatedSubsData
            });
            if (scenarioResultsDiv) scenarioResultsDiv.style.display = 'block';
            if (printDownloadSection) printDownloadSection.style.display = 'block'; 
            if (manualRovingAssignModeButton && numRovingSubsScenario > 0) manualRovingAssignModeButton.style.display = 'inline-block';
            else if (manualRovingAssignModeButton) manualRovingAssignModeButton.style.display = 'none';

        } catch (error) {
            console.error("SCENARIO: CRITICAL ERROR in runScenarioAnalysis:", error);
            displayError("Error running scenario: " + error.message);
            if (visualScheduleTableContainer) visualScheduleTableContainer.innerHTML = `<p class="placeholder-text error">Error generating scenario visual: ${error.message}</p>`;
            if (scenarioResultsDiv) scenarioResultsDiv.innerHTML = `<p class="error">Failed to generate scenario results: ${error.message}</p>`;
        }
    }

    function updateVisualScheduleForManualRovingMode(isActive) {
        const table = visualScheduleTableContainer.querySelector('.schedule-table');
        if (!table) return;
        if (isActive) {
            table.classList.add('manual-roving-active'); 
            addCellClickListenersToTable();
        } else {
            table.classList.remove('manual-roving-active');
            removeCellClickListenersFromTable();
        }
    }

});