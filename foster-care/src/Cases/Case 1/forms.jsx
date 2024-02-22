import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { TreeView } from '@mui/x-tree-view/TreeView';
import { CustomTreeItem } from '../CustomTreeItem';
import {useEffect, useRef, useState} from 'react';
import ObjectiveForm from '../../Forms/FormObjective';
import InterventionForm from '../../Forms/FormIntervention';
import GoalForm from '../../Forms/FormGoal';
import SubmitDataButton from "../../submitButton";
import { useHistory } from "react-router-dom";
import usePageTimer from "../pagetimer";

export default function FORMS() {
    const elapsedTime = usePageTimer('Treatment Plan')

    const [expanded, setExpanded] = React.useState([]);
    const [selected, setSelected] = React.useState([]);
    const [goalCounter, setGoalCounter] = React.useState(1);
    const [objectiveCounter, setObjectiveCounter] = React.useState(1);
    const [interventionCounter, setInterventionCounter] = React.useState(1);

    // const [elapsedTimer, setElapsedTimer] = useState(0);
    // const [timer, setTimer] = useState(null);

    const [data, setData] = React.useState({
        id: 'root',
        name: ' ',
        expanded: true,
    });

    const history = useHistory();

    // const handleSubmitData = () => {
    //     const localStorageData = {};
    //
    //     for (let key in localStorage) {
    //         if (
    //             key.startsWith('goal') ||               // form data
    //             key.startsWith('intervention') ||       // form data
    //             key.startsWith('objective') ||          // form data
    //             key === 'treeData' ||                   // tree data
    //             key === 'expandedNodes' ||              // expanded nodes
    //             key === 'totalTime' ||                  // time spent on pdfs
    //             key === 'formTimeSpent' ||              // time spend on forms
    //             key === 'narrativeInput'                // narrative data
    //         ) {
    //             localStorageData[key] = localStorage.getItem(key);
    //         }
    //     }
    //
    //     console.log(localStorageData)
    //     // send it to server when i a db to connect to
    //
    //     // eslint-disable-next-line no-restricted-globals
    //     history.push('/likert');
    //
    //     // return localStorageData;
    // };

    useEffect(() => {
        const expandedNodes = JSON.parse(localStorage.getItem('expandedNodes'));
        if (expandedNodes) {
            setExpanded(expandedNodes);
        }
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            localStorage.setItem('expandedNodes', JSON.stringify(expanded));
            localStorage.setItem('treeData', JSON.stringify(data));
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [expanded, data]);

    useEffect(() => {
        const localStorageData = JSON.parse(localStorage.getItem('treeData'));
        if (localStorage.getItem("goalsCreated") === null) {
            localStorage.setItem("goalsCreated", JSON.stringify(0));
            localStorage.setItem("objectivesCreated", JSON.stringify(0));
            localStorage.setItem("interventionsCreated", JSON.stringify(0));
        }

        setGoalCounter(JSON.parse(localStorage.goalsCreated));
        setObjectiveCounter(JSON.parse(localStorage.objectivesCreated));
        setInterventionCounter(JSON.parse(localStorage.interventionsCreated));

        if (localStorageData) {
            setData(localStorageData);
        }

    }, []);

    // Warn the user before refreshing the page
    useEffect(() => {
        const handleBeforeUnload = (event) => {
            event.preventDefault();
            event.returnValue = 'All form data will be erased if you refresh. Do you want to continue?';

            // Check if the user is trying to refresh
            // can't find better documentation on navigation.type
            if (performance.navigation.type === 1) {
                console.log('reloaded');
                // The navigation type indicates a page reload
                localStorage.removeItem('treeData'); // Reset localStorage
                localStorage.removeItem('expandedNodes');
                for (let key in localStorage) {
                    if (key.startsWith('objective') || key.startsWith('goal') || key.startsWith('intervention')) {
                        localStorage.removeItem(key);
                    }
                }
            } else {
                // The user canceled the refresh
                event.preventDefault();
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);



    const handleToggle = (event, nodeIds) => {
        setExpanded(nodeIds);
    };

    const handleSelect = (event, nodeIds) => {
        setSelected(nodeIds);
    };

    const handleExpandClick = () => {
        const allNodeIds = collectNodeIds(data);

        setExpanded((oldExpanded) =>
            oldExpanded.length === 0 ? allNodeIds : []
        );
    };

    const collectNodeIds = (node) => {
        const nodeIds = [node.id];

        if (Array.isArray(node.children)) {
            node.children.forEach((child) => {
                nodeIds.push(...collectNodeIds(child));
            });
        }

        return nodeIds;
    };

    const [formVisibility, setFormVisibility] = useState({});
    const [formTimeSpent, setFormTimeSpent] = useState({});

    useEffect(() => {
        const storedFormTimeSpent = JSON.parse(localStorage.getItem('formTimeSpent'));
        if (storedFormTimeSpent) {
            setFormTimeSpent(storedFormTimeSpent);
        }
    }, []);

    // useeffect based on form visibility
    // when a form is visible take the nodeID
    // start a timer
    // push both to elapsedTimes when nodeID changes or form visibility changes
    const toggleFormVisibility = (nodeId) => {
        const updatedFormVisibility = { ...formVisibility };
        updatedFormVisibility[nodeId] = !formVisibility[nodeId];

        const updatedFormTimeSpent = { ...formTimeSpent };
        const now = Date.now();

        if (updatedFormVisibility[nodeId]) {
            updatedFormTimeSpent[nodeId] = updatedFormTimeSpent[nodeId] || 0;
            updatedFormTimeSpent[nodeId] -= now;
        } else {
            const openTimestamp = formTimeSpent[nodeId];
            if (openTimestamp) {
                const elapsedTime = openTimestamp + now;
                updatedFormTimeSpent[nodeId] = elapsedTime;
                localStorage.setItem('formTimeSpent', JSON.stringify(updatedFormTimeSpent));
            }
        }

        for (const key in updatedFormVisibility) {
            if (key !== nodeId) {
                updatedFormVisibility[key] = false;
            }
        }

        setFormVisibility(updatedFormVisibility);
        setFormTimeSpent(updatedFormTimeSpent);
    };

    // pleaze work
    // Effect to track when a form becomes visible and start a timer
    useEffect(() => {
        for (const nodeId in formVisibility) {
            if (formVisibility[nodeId]) {
                console.log("Visible Form Node ID:", nodeId);

                // Start the timer when the form becomes visible
                const startTime = Date.now();

                // Store the start time in localStorage
                localStorage.setItem(`startTime_${nodeId}`, startTime.toString());
            } else {
                // If the form becomes hidden, calculate the elapsed time
                const startTime = parseInt(localStorage.getItem(`startTime_${nodeId}`));
                if (startTime) {
                    const elapser = Date.now() - startTime;
                    const elapsedTime = Math.floor(elapser/1000);
                    console.log(`Form ${nodeId} was open for ${elapsedTime} milliseconds`);

                    // Retrieve existing elapsed time data from localStorage
                    const storedElapsedTime = JSON.parse(localStorage.getItem("elapsedTimes")) || [];

                    // Add the current pair to the list of elapsed times
                    storedElapsedTime.push({ nodeId, elapsedTime });

                    // Store the updated elapsed time data back into localStorage
                    localStorage.setItem("elapsedTimes", JSON.stringify(storedElapsedTime));

                    // Remove the start time entry from localStorage
                    localStorage.removeItem(`startTime_${nodeId}`);
                }
            }
        }
    }, [formVisibility]);


    // Effect to track when a form becomes visible and start a timer
    // const startTimeRef = useRef(null);
    // useEffect(() => {
    //     if (timer) {
    //         clearInterval(timer)
    //     }
    //     for (const nodeId in formVisibility) {
    //         // when node is visible
    //         if (formVisibility[nodeId]) {
    //             console.log("Visible Form Node ID:", nodeId);
    //             // Start and store
    //             const startTime = Date.now(); // Record the start time when the tab is focused
    //             startTimeRef.current = startTime; // Store the start time
    //             const newTimer = setInterval(() => {
    //                 const currentTime = Date.now();
    //                 const elapsedTimeSeconds = Math.floor((currentTime - startTime) / 1000); // Calculate elapsed time in seconds
    //                 setElapsedTimer(elapsedTimeSeconds);
    //             }, 1000); // Update elapsed time every second
    //             setTimer(newTimer);
    //         } else {
    //             // else means the form becomes hidden so now calculate time
    //             // startTime
    //             console.log(`Form ${nodeId} was open for ${elapsedTimer} seconds`);
    //             // retrieve
    //             const storedElapsedTime = JSON.parse(localStorage.getItem("elapsedTimes")) || [];
    //             // insert
    //             storedElapsedTime.push({ nodeId, elapsedTime });
    //             // store
    //             localStorage.setItem("elapsedTimes", JSON.stringify(storedElapsedTime));
    //             // Remove the start time entry from localStorage
    //             localStorage.removeItem(`startTime_${nodeId}`);
    //         }
    //     }
    // }, [formVisibility]);


    const CustomLabel = ({ node }) => {
        const [newNodeName, setNewNodeName] = React.useState();

        const handleNameChange = (event) => {
            setNewNodeName(event.target.value);
        };

        const addNode = () => {
            let newNodeNameToUse = newNodeName || 'Objective ';

            if (node.name === ' ') {
                newNodeNameToUse = newNodeName || 'Goal ';
            }

            if (node.name === 'Objective ') {
                newNodeNameToUse = 'Intervention ';
            }

            let newId = '';
            if (newNodeNameToUse === 'Goal ') {
                newId = `goal ${goalCounter}`;
                setGoalCounter(goalCounter + 1);
                localStorage.setItem("goalsCreated", JSON.stringify(goalCounter+1));
            } else if (newNodeNameToUse === 'Objective ') {
                newId = `objective ${objectiveCounter}`;
                setObjectiveCounter(objectiveCounter + 1);
                localStorage.setItem("objectivesCreated", 
                                    JSON.stringify(objectiveCounter+1));
            } else if (newNodeNameToUse === 'Intervention ') {
                newId = `Intervention: ${interventionCounter}`;
                setInterventionCounter(interventionCounter + 1);
                localStorage.setItem("interventionsCreated", 
                                    JSON.stringify(interventionCounter+1));
            }

            const newNode = {
                id: newId,
                name: newNodeNameToUse,
                expanded: true,
            };

            const updatedDataWithNewNode = updateNode(data, node, newNode);

            if (!expanded.includes('root')) {
                setExpanded([...expanded, 'root', newNode.id]);
            } else {
                setExpanded([...expanded, newNode.id]);
            }

            setData(updatedDataWithNewNode);
        };

        return (
            <div>
                {node.name}
                {node.name === ' ' && (
                    <input
                        style={{ width: '50%' }}
                        type="text"
                        placeholder="Goal"
                        value={newNodeName}
                        onChange={handleNameChange}
                    />
                )}
                {node.name !== 'Intervention ' && (
                    <button onClick={addNode}> + </button>
                )}
            </div>
        );
    };

    const updateNode = (currentNode, targetNode, newNode) => {
        if (currentNode.id === targetNode.id) {
            return {
                ...currentNode,
                children: [...(currentNode.children || []), newNode],
            };
        } else if (currentNode.children) {
            const updatedChildren = currentNode.children.map((childNode) =>
                updateNode(childNode, targetNode, newNode)
            );
            return { ...currentNode, children: updatedChildren };
        } else {
            return currentNode;
        }
    };

    const renderTree = (nodes) => (
        <CustomTreeItem
            key={nodes.id}
            nodeId={nodes.id}
            label={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <CustomLabel node={nodes} />
                    {nodes.id !== 'root' && (
                        <button onClick={() => toggleFormVisibility(nodes.id)}>
                            {formVisibility[nodes.id] ? 'close' : 'open'}
                        </button>
                    )}
                </div>
            }
        >
            {formVisibility[nodes.id] && (
                nodes.name === 'Objective ' ? (
                    <ObjectiveForm nodeId={nodes.id} />
                ) : nodes.name === 'Intervention ' ? (
                    <InterventionForm nodeId={nodes.id} interventionCounter={nodes.id} />
                ) : (
                    <GoalForm nodeId={nodes.id}/>
                )
            )}

            {Array.isArray(nodes.children)
                ? nodes.children.map((node) => renderTree(node))
                : null}
        </CustomTreeItem>
    );

return (
    <Box sx={{ minHeight: 270, flexGrow: 1, maxWidth: 300 }}>
        <Box sx={{ display: 'flex' }}>
            <Button onClick={handleExpandClick}>
                {expanded.length === 0 ? 'Expand all' : 'Collapse all'}
            </Button>
        </Box>
        <TreeView
            aria-label="controlled"
            expanded={expanded}
            selected={selected}
            onNodeToggle={handleToggle}
            onNodeSelect={handleSelect}
        >
            {renderTree(data)}
        </TreeView>

        <p>{elapsedTime} sec</p>

        <SubmitDataButton/>
    </Box>
);
}
