/* ***************************************** */
/*          Define helper functions          */
/* ***************************************** */
function exitFullScreen() {
    var isInFullScreen = (document.fullscreenElement && document.fullscreenElement !== null) ||
        (document.webkitFullscreenElement && document.webkitFullscreenElement !== null) ||
        (document.mozFullScreenElement && document.mozFullScreenElement !== null) ||
        (document.msFullscreenElement && document.msFullscreenElement !== null);

    var docElm = document.documentElement;
    if (isInFullScreen) {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

function saveDataOnServer(usepid){
	var filedata = jsPsych.data.dataAsCSV();
	var pid_response = jsPsych.data.getData()[0].participant_id;
	var filenameMatch = pid_response.match(".*?(\\w+).*?");
	var d = new Date();
	if (filenameMatch == null && usepid) {
		filename = "split-bad_pid_" + d.getTime() + ".csv";	
	} else if (usepid) {
		filename = "split-" + filenameMatch[1] + "-" + d.getTime() + ".csv";
	} else {
		aYear = d.getFullYear().toString();
		aMonth = d.getMonth();
		aDate = d.getDate();
		aMonth = (aMonth < 10) ? "0" + aMonth : aMonth.toString();
		aDate = (aDate < 10) ? "0" + aDate : aDate.toString();
		filename = ".split-" + aYear + aMonth + aDate + d.getTime() + ".csv";
	}
	$.ajax({
		type:'post',
		cache: false,
		url: 'static/experiments/soc_prob_learning/save_data.php', // this is the path to the above PHP script
		data: {filename: filename, filedata: filedata}
	});
}

function summarizePoints(){
	var some_data = jsPsych.data.getTrialsOfType('poldrack-categorize');
	var points = 0;
	var possible = 0;
	for (var i = 0; i < some_data.length; i++){
		if (some_data[i].feedback){
			points += some_data[i].reward_possible;
		}
		possible += some_data[i].reward_possible;
	}
	return points + ' / ' + possible;
}

function evalAttentionChecks() {
	var check_percent = 1
	if (run_attention_checks) {
		var attention_check_trials = jsPsych.data.getTrialsOfType('attention-check')
		var checks_passed = 0
		for (var i = 0; i < attention_check_trials.length; i++) {
			if (attention_check_trials[i].correct === true) {
				checks_passed += 1
			}
		}
		check_percent = checks_passed / attention_check_trials.length
	}
	return check_percent
}

var getPIDDisplayText = function() {
    return '<p class = block-text>Your ID number is ' +  jsPsych.data.getData()[0].participant_id +  '. Press <strong>enter</strong>' 
}

var getInstructFeedback = function() {
	return '<div class = centerbox><p class = center-block-text>' + feedback_instruct_text +
		'</p></div>'
}

function assessPerformance() {
	/* Function to calculate the "credit_var", which is a boolean used to
	credit individual experiments in expfactory. */
	var experiment_data = jsPsych.data.getTrialsOfType('poldrack-single-stim')
	experiment_data = experiment_data.concat(jsPsych.data.getTrialsOfType('poldrack-categorize'))
	var missed_count = 0
	var trial_count = 0
	var rt_array = []
	var rt = 0
	//record choices participants made
	var choice_counts = {}
	choice_counts[-1] = 0
	for (var k = 0; k < choices.length; k++) {
		choice_counts[choices[k]] = 0
	}
	for (var i = 0; i < experiment_data.length; i++) {
		trial_count += 1
		rt = experiment_data[i].rt
		key = experiment_data[i].key_press
		choice_counts[key] += 1
		if (rt == -1) {
			missed_count += 1
		} else {
			rt_array.push(rt)
		}
	}
	//calculate average rt
	var sum = 0
	for (var j = 0; j < rt_array.length; j++) {
		sum += rt_array[j]
	}
	var avg_rt = sum / rt_array.length || -1
		//calculate whether response distribution is okay
	var responses_ok = true
	Object.keys(choice_counts).forEach(function(key, index) {
		if (choice_counts[key] > trial_count * 0.85) {
			responses_ok = false
		}
	})
	var missed_percent = missed_count/trial_count
	credit_var = (missed_percent < 0.4 && avg_rt > 200 && responses_ok)

	jsPsych.data.addDataToLastTrial({"credit_var": credit_var})
}

var getStim = function() {
	stim = firstPhaseStimsComplete.image.pop()
	curr_data = firstPhaseStimsComplete.data.pop()
	rewardAmount = rewards.pop()
	return stim;
}

var getData = function() {
	return curr_data
}

var getResponse = function() {
	return answers.pop()
}

var genRewards = function(stimuli){
	var possibleRewards=[];
	var rewardCount = [];
	for (var i = 0; i < nStimuli; i++) {
		 possibleRewards[i] = jsPsych.randomization.repeat([1, 5], FP_trials/6/2);
		 rewardCount[i] = 0;
	}
	var rewards = [];
	for(var i = 0; i < FP_trials; i++) {
		stimIndex = stimuli.data[i].stimindex;
		rewards.push(possibleRewards[stimIndex][rewardCount[stimIndex]]);
		rewardCount[stimIndex] = rewardCount[stimIndex] + 1;
	}
	return rewards;
}

var genResponses = function(stimuli) {
	var answers_80_20 = jsPsych.randomization.repeat([37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 37, 39, 39, 39, 39, 39],
		eachComboNum / 24);
	var answers_20_80 = jsPsych.randomization.repeat([39, 39, 39, 39, 39, 39, 39, 39, 39, 39, 39, 39, 39, 39, 39, 39, 39, 39, 39, 37, 37, 37, 37, 37],
		eachComboNum / 24);

	var count1 = 0;
	var count2 = 0;

	var answers = [];
	for (var i = 0; i < FP_trials; i++) {

		if (stimuli.data[i].condition === '80_20') {
			answers.push(answers_80_20[count1]);
			count1 = count1 + 1;
		} else if (stimuli.data[i].condition === '20_80') {
			answers.push(answers_20_80[count2]);
			count2 = count2 + 1;
		}
	}
	return answers;
};
var getCorrectStatement = function() {
	pointText = (rewardAmount == 1) ? ' point' : ' points';
	correctStatement = '<div class = feedback-box><div style="color:green"; class = center-text>' + rewardAmount + ' / ' + rewardAmount + pointText + '!</div></div>';
	return correctStatement 
}
var getIncorrectStatement = function() {
	pointText = (rewardAmount == 1) ? ' point' : ' points';
	inCorrectStatement = '<div class = feedback-box><div style="color:green"; class = center-text>' + '0 / ' + rewardAmount + pointText + '</div></div>';
	return inCorrectStatement
}

var endSocProbLearn = function() {
    exitFullScreen()
    returnText = '<div class = centerbox>';
    if (urlpid != null) {
        returnText = returnText + '<p><strong>DONE WITH PART 1 of 2</strong></p><p>Please follow <a href="https://oregon.qualtrics.com/jfe/form/SV_4YpmWgP8EWWNp5z?participantid=' + jsPsych.data.getData()[0].participant_id + '">this link to the questionnaire</a>, which is the final part of this study.</p></div>';
    } else {
        returnText = returnText + '<p>Please let the researcher know you are finished</p></div>';
    }
    console.log(returnText);
    var el = jsPsych.getDisplayElement();
    el.append(returnText);
}

/*************************************************************************/
/*                 DEFINE EXPERIMENTAL VARIABLES                         */
/*************************************************************************/
// generic task variables
var run_attention_checks = false
var save_data_to_server = true //requires server that allows POST and php scripts
var attention_check_thresh = 0.45
var sumInstructTime = 0 //ms
var instructTimeThresh = 0 ///in seconds
var credit_var = true

// task specific variables
var choices = [37, 39]
var curr_data = []
var stim = ''
/* SPECIFY HOW MANY TRIALS YOU WANT PER TRAINING BLOCK.  FP_trials must be divisible by 48 */
var FP_trials = 48;
var eachComboNum = FP_trials / 1; /* don't change this line */
var stimSetRepNum = FP_trials / 12;
var nStimuli = 6;

/* THIS IS TO RANDOMIZE STIMS */
var mStimArray = [
	"static/experiments/soc_prob_learning/images/male1.jpg",
	"static/experiments/soc_prob_learning/images/male2.jpg",
	"static/experiments/soc_prob_learning/images/male3.jpg",
];
var fStimArray = [
	"static/experiments/soc_prob_learning/images/female1.jpg",
	"static/experiments/soc_prob_learning/images/female2.jpg",
	"static/experiments/soc_prob_learning/images/female3.jpg",
];
jsPsych.pluginAPI.preloadImages(mStimArray)
jsPsych.pluginAPI.preloadImages(fStimArray)
var randomMStimArray = jsPsych.randomization.repeat(mStimArray, 1);
var randomFStimArray = jsPsych.randomization.repeat(fStimArray, 1);

var randomStatusStimArray = jsPsych.randomization.repeat([randomMStimArray[0], randomFStimArray[0]], 1);
var randomMateseekStimArray = jsPsych.randomization.repeat([randomMStimArray[1], randomFStimArray[1]], 1);
var randomSocStimArray = jsPsych.randomization.repeat([randomMStimArray[2], randomFStimArray[2]], 1);

var stimsMF = [
	[['80','20'], 'status', randomStatusStimArray[0]],
	[['20','80'], 'status', randomStatusStimArray[1]],
	[['80','20'], 'mateseek', randomMateseekStimArray[0]],
	[['20','80'], 'mateseek', randomMateseekStimArray[1]],
	[['80','20'], 'soc', randomSocStimArray[0]],
	[['20','80'], 'soc', randomSocStimArray[1]]
];

var instructionStims = jsPsych.randomization.repeat(stimsMF, 1);

firstPhaseStims = [];
stims=[stimsMF]; //dropping abstract stims for now
/* THIS IS FOR FIRST PHASE STIMS,  randomized and counterbalanced*/
for(var j = 0; j < stims.length; j++){
	for (var i = 0; i < stims[j].length; i++) {
		var prompts = []
		switch(stims[j][i][1]){
			case 'status':
				prompts[0] = 'Popular';
				prompts[1] = 'Not popular';
				break;
			case 'mateseek':
				prompts[0] = 'Flirty';
				prompts[1] = 'Not flirty';
				break;
			case 'soc':
				prompts[0] = 'Has siblings';
				prompts[1] = 'Doesn\'t have siblings';
				break;
			case 'abstract':
				prompts[0] = 'Sunny';
				prompts[1] = 'Rainy';
				break;
		}
		var order1_stim = {}

		order1_stim.image = "<div class = topbox><img src='" + stims[j][i][2] +
			"'></img></div><div class = decision-left>" + prompts[0] + 
			"</div><div class = decision-right>" + prompts[1] + 
			"</div>";
		parsedFilename = stims[j][i][2].match("/([mf]).*?[0-9]\.jpg");	
		stimGender = parsedFilename[1];
		order1_stim.data = {
			trial_id: 'stim',
			exp_stage: 'training',
			image: stims[j][i][2],
			context: prompts[0] + '_' + prompts[1],
			condition: stims[j][i][0][0] + '_' + stims[j][i][0][1],
			optimal_response: (stims[j][i][0][0] > stims[j][i][0][1]) ? 37 : 39,
			stim_gender: stimGender,
			stimindex: i
		}
		var order2_stim = {}
		order2_stim.image = "<div class = topbox><img src='" + stims[j][i][2] +
			"'></img></div><div class = decision-left>" + prompts[1] + 
			"</div><div class = decision-right>" + prompts[0] + 
			"</div>";
		order2_stim.data = {
			trial_id: 'stim',
			exp_stage: 'training',
			image: stims[j][i][2],
			context: prompts[1] + '_' + prompts[0],
			condition: stims[j][i][0][1] + '_' + stims[j][i][0][0],
			optimal_response: (stims[j][i][0][1] > stims[j][i][0][0]) ? 37 : 39,
			stim_gender: stimGender,
			stimindex: i
		}
		firstPhaseStims.push(order1_stim);
		firstPhaseStims.push(order1_stim); //no longer switching sides
	}
}

var firstPhaseStimsComplete = jsPsych.randomization.repeat(firstPhaseStims, stimSetRepNum, true);
var answers = genResponses(firstPhaseStimsComplete)
var rewards = genRewards(firstPhaseStimsComplete)
var curr_data = ''

/* This is to end the training while loop, if the subject has reached 6 training blocks */
var training_count = 0;



/* ************************************ */
/*         Set up jsPsych blocks        */
/* ************************************ */
// Set up attention check node
var attention_check_block = {
	type: 'attention-check',
	data: {
		trial_id: "attention_check"
	},
	timing_response: 180000,
	response_ends_trial: true,
	timing_post_trial: 200
}

var attention_node = {
	timeline: [attention_check_block],
	conditional_function: function() {
		return run_attention_checks
	}
}

//Set up post task questionnaire
var post_task_block = {
   type: 'survey-text',
   data: {
       trial_id: "post task questions"
   },
   questions: ['<p class = center-block-text style = "font-size: 20px">Please summarize what you were asked to do in this task.</p>',
              '<p class = center-block-text style = "font-size: 20px">Do you have any comments about this task?</p>'],
   rows: [15, 15],
   columns: [60,60]
};
//Set up PID entry
//
var set_pid_property_block = {
    type: 'call-function',
    func: function() { jsPsych.data.addProperties({participant_id: urlpid});}
} 

var display_pid_block = {
    type: 'poldrack-text',
    data: {
        trial_id: "PID",
    },
    cont_key: [13],
    text: getPIDDisplayText 
}
var enter_pid_block = {
	type: 'survey-text',
	data: {
		trial_id: "PID"
	},
	questions: ['<p class = center-block-text style = "font-size: 20px">Please enter the participant\'s ID number.</p>'],
	rows: [3],
	columns: [4],
    on_finish: function(data) {
        jsPsych.data.addProperties({participant_id: JSON.parse(data.responses).Q0});
    }
}


/* define static blocks */
var feedback_instruct_text =
	'Welcome to the experiment. This experiment will take about 20 minutes. Press <strong>enter</strong> to begin.'
var feedback_instruct_block = {
	type: 'poldrack-text',
	data: {
		trial_id: "instruction"
	},
	cont_key: [13],
	text: getInstructFeedback,
	timing_post_trial: 0,
	timing_response: 180000
};
/// This ensures that the subject does not read through the instructions too quickly.  If they do it too quickly, then we will go over the loop again.
var instructions_block = {
	type: 'poldrack-instructions',
	data: {
		trial_id: "instruction"
	},
	pages: [
		'<div class = bigtextbox><p class = block-text>In this experiment, you\'re going to see pictures of 6 different faces. Along with each picture, you\'ll see a pair of words, and we want you to try to guess which word goes with which picture.</p><p class = block-text>For 2 faces, you\'ll guess whether the person in the picture is <strong>popular</strong> or <strong> not popular</strong>.</p><p class = block-text>For 2 other faces, you\'ll guess whether the person is <strong>flirty</strong> or <strong>not flirty</strong>.</p><p class = block-text>For the last 2 faces, you\'ll guess whether the person <strong>has siblings</strong> or <strong>doesn\'t have siblings</strong>.</p><p class = block-text>To make your guess, press the <strong>left arrow</strong> for the left answer or the <strong>right arrow</strong> for the right answer.</p></div>',
	'<div class = bigtextbox><p class = block-text>The same word goes with the same picture most of the time, <em>but not always</em>. After each guess you\'ll see the number of points you earned. For example, if you see "5/5 points" below the picture, it means you were correct and earned 5 points. But if you guess incorrectly, you won\'t get any points, so you\'ll just see the number of points you could have gotten. For example, "0/1 point" means you were wrong and got 0 out of 1 possible point.</p><p class = block-text>Try to guess correctly as often as you can to get the most points.</p><p class = block-text>Remember, press the <strong>left arrow</strong> for the left answer or the <strong>right arrow</strong> for the right answer.</p><!-- <p class=block-text><strong>Each point is worth a penny</strong>, so you can earn up to about $10</p> --></div>',
	'<div class = bigtextbox><p class = block-text>These are the six faces you\'re going to see in the task. Look at them now so they\'re easier to recognize when you play the game:</p><p class = block-text-img><img src="'+ instructionStims[0][2]  +'" /><img src="'+ instructionStims[1][2]  +'" /><img src="'+ instructionStims[2][2]  +'" /><br /><img src="'+ instructionStims[3][2]  +'" /><img src="'+ instructionStims[4][2]  +'" /><img src="'+ instructionStims[5][2]  +'" /></p><p class = block-text>Remember, you\'re going to use the <strong>left</strong> and <strong>right</strong> arrow keys when the game starts.</p></div>'],
	allow_keys: false,
	show_clickable_nav: true,
	timing_post_trial: 1000
};

var instruction_node = {
	timeline: [feedback_instruct_block, instructions_block],
	/* This function defines stopping criteria */
	loop_function: function(data) {
		for (i = 0; i < data.length; i++) {
			if ((data[i].trial_type == 'poldrack-instructions') && (data[i].rt != -1)) {
				rt = data[i].rt
				sumInstructTime = sumInstructTime + rt
			}
		}
		if (sumInstructTime <= instructTimeThresh * 1000) {
			feedback_instruct_text =
				'Read through instructions too quickly.  Please take your time and make sure you understand the instructions.  Press <strong>enter</strong> to continue.'
			return true
		} else if (sumInstructTime > instructTimeThresh * 1000) {
			feedback_instruct_text = 'Done with instructions. Press <strong>enter</strong> to continue.'
			return false
		}
	}
}

var FP_block = {
	type: 'poldrack-text',
	data: {
		trial_id: "first_phase_intro"
	},
	timing_response: 180000,
	text: '<div class = centerbox><p class = center-block-text> Please let the researcher know you have finished reading the instructions. </p></div>',
	cont_key: [13],
	timing_post_trial: 1000
};

var get_ready_block = {
	type: 'poldrack-text',
	data: {
		trial_id: "get_ready_block"
	},
	timing_response: 180000,
	text: '<div class = centerbox><p class = center-block-text>Ready to get started? Place your fingers on the left and right arrow keys, and then press <strong>enter</strong> to continue. Don\'t worry if you miss the first face&mdash;just start responding as quickly as you can.</p></div>',
	cont_key: [13],
	timing_post_trial: 1000
};

var metacog_block = {
	type: 'poldrack-survey-multi-choice',
	data: {
		trial_id: 'metacog',
		exp_id: 'soc_prob_learning'
	},
	preamble: "Answer the following question, then click 'next.'",
	pages: [["Do you know which face goes with which word?"]],
	options: [[["1. I definitely don't know any", "2.", "3. I might know some", "4.", "5. I definitely know all of them"]]],
	scale: [[{
		"1. I definitely don't know any": 1, 
		"2.": 2, 
		"3. I might know some": 3, 
		"4.": 4, 
		"5. I definitely know all of them": 5
	}]],
	show_clickable_nav: true,
	allow_backward: false,
	horizontal: true
};


var break_block = {
	type: 'poldrack-text',
	data: {
		trial_id: "break",
		exp_id: 'soc_prob_learning'
	},
	timing_response: 15000,
	text: '<div class = centerbox><p class = center-block-text>Take a short break.</p><p class = center-block-text>Task will automatically start in 15 seconds, or <br />press <strong>enter</strong> to continue.</p></div>',
	cont_key: [13],
};

var break_node = {
	timeline: [metacog_block, break_block],
	conditional_function: function(){
		if(training_count==8){
			return false;
		} else {
			return true;
		}
	}
}


training_trials = []
for (i = 0; i < 48; i++) {
	var training_block = {
		type: 'poldrack-categorize',
		stimulus: getStim,
		key_answer: getResponse,
		choices: choices,
		//prompt: '<div class = topbox><div class = center-text>Optional Prompt</div></div>',
		correct_text: getCorrectStatement,
		incorrect_text: getIncorrectStatement,
		timeout_message: '<div class = feedback-box><div class = center-text>no response detected</div></div>',
		timing_stim: 3500,
		timing_response: 3500,
		timing_feedback_duration: 1000,
		response_ends_trial: true,
		timing_post_trial: 250,
		is_html: true,
		data: getData,
		on_finish: function(data) {
			choice = choices.indexOf(data.key_press)
			stims = data.condition.split('_')
			chosen_stim = stims[choice]
			correct = false
			if (data.key_press == data.optimal_response){
				correct = true
			}
			jsPsych.data.addDataToLastTrial({
				'feedback': data.correct,
				'correct': correct,
				'stim_chosen': chosen_stim,
				'reward_possible': rewardAmount
			})
		}
	};
	training_trials.push(training_block)
}

training_trials.push(break_node);

var performance_criteria = {
	timeline: training_trials,
	loop_function: function(data) {
//		var ab_total_correct = 0;
//		var cd_total_correct = 0;
//		var ef_total_correct = 0;
//		var ab_cum_trials = 0;
//		var cd_cum_trials = 0;
//		var ef_cum_trials = 0;
//		for (var i = 0; i < data.length; i++) {
//			if (data[i].condition == "80_20" || data[i].condition == "20_80" ) {
//				ab_cum_trials = ab_cum_trials + 1;
//				if (data[i].key_press === data[i].optimal_response) {
//					ab_total_correct = ab_total_correct + 1;
//				}
//			} else if (data[i].condition == "70_30" || data[i].condition == "30_70") {
//				cd_cum_trials = cd_cum_trials + 1;
//				if (data[i].key_press === data[i].optimal_response) {
//					cd_total_correct = cd_total_correct + 1;
//				}
//			} else if (data[i].condition == "60_40" || data[i].condition == "40_60") {
//				ef_cum_trials = ef_cum_trials + 1;
//				if (data[i].key_press === data[i].optimal_response) {
//					ef_total_correct = ef_total_correct + 1;
//				}
//			}
//		}
//		var ab_percent = ab_total_correct / ab_cum_trials
//		var cd_percent = cd_total_correct / cd_cum_trials
//		var ef_percent = ef_total_correct / ef_cum_trials
		training_count = training_count + 1;

		if (training_count == 8) {
			return false
		} else {
			firstPhaseStimsComplete = jsPsych.randomization.repeat(firstPhaseStims, stimSetRepNum, true);
			answers = genResponses(firstPhaseStimsComplete)
			rewards = genRewards(firstPhaseStimsComplete)
			return true
		}
	},
	on_finish: function(data) {
		assessPerformance(data);
		var total_points = summarizePoints();
		jsPsych.data.addDataToLastTrial({
			'total_points' : total_points
		})
		if (save_data_to_server == true){
			usepid=false;
			saveDataOnServer(usepid); 
		}
	}
};

var pre_end_block = {
	type: 'poldrack-text',
	data: {
		trial_id: "end",
		exp_id: 'soc_prob_learning'
	},
	timing_response: 180000,
	text: function() {
		return '<div class = centerbox><p class = center-block-text>Finished with this task! You earned a total of <strong>' + summarizePoints() + '</strong> points! Remember to tell the researcher how many points you earned.</p><p class = center-block-text>Press <strong>enter</strong> to continue.</p></div>'
	},
	cont_key: [13],
	on_finish: function(data) {
		assessPerformance(data);
		var total_points = summarizePoints();
		jsPsych.data.addDataToLastTrial({
			'total_points' : total_points
		})
		if (save_data_to_server == true){
			usepid=true;
			saveDataOnServer(usepid); 
		}
	}
};

var pre_end_block_to_qualtrics = {
	type: 'poldrack-text',
	data: {
		trial_id: "end",
		exp_id: 'soc_prob_learning'
	},
	timing_response: 180000,
	text: function() {
        returnText = '<div class = centerbox><p class = center-block-text>Finished with this task! You earned a total of <strong>' + summarizePoints() + '</strong> points! Press <strong>enter</strong> to continue.</p></div>';
        return returnText
	},
	cont_key: [13],
	on_finish: function(data) {
		assessPerformance(data);
		var total_points = summarizePoints();
		jsPsych.data.addDataToLastTrial({
			'total_points' : total_points
		})
		if (save_data_to_server == true){
			usepid=true;
			saveDataOnServer(usepid); 
		}
        endSocProbLearn();
	}
};

/* create experiment definition array */
var soc_prob_learning_experiment = [];
var urlpid=jsPsych.data.getURLVariable('participantid')
if (urlpid == null){
    soc_prob_learning_experiment.push(enter_pid_block); 
//    soc_prob_learning_experiment.push(display_pid_block);
} else {
    soc_prob_learning_experiment.push(set_pid_property_block);
//    soc_prob_learning_experiment.push(display_pid_block);
}
soc_prob_learning_experiment.push(instruction_node);
if (urlpid == null){
    soc_prob_learning_experiment.push(FP_block);
} else {
    soc_prob_learning_experiment.push(get_ready_block);
}
soc_prob_learning_experiment.push(performance_criteria);
soc_prob_learning_experiment.push(attention_node);
soc_prob_learning_experiment.push(post_task_block);
if (urlpid == null){
    soc_prob_learning_experiment.push(pre_end_block);
} else {
    soc_prob_learning_experiment.push(pre_end_block_to_qualtrics);
}

