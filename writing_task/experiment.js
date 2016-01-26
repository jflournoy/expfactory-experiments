
/* ************************************ */
/* Define helper functions */
/* ************************************ */
function getDisplayElement () {
    $('<div class = display_stage_background></div>').appendTo('body')
    return $('<div class = display_stage></div>').appendTo('body')
}

var qualityCheck = function(data) {

	var arraySum = function(lst) {
	   var count=0;
	   for (var i=lst.length; i--;) {
	     count+=lst[i];
	   }
	   return count
	}

	var rt_thresh = 200 // avg rt has to be above this thresh
	var response_thresh = 0.8 // percent response needs to be above this thresh
	var attention_thresh = 0.8 // successful attention checks needs to be above this thresh

	var track_rts = []
	var track_responses = []

	for (var i = 0; i < data.length; i++) {
		var trial = data[i]
		// Check if subject could have responded with a key
		if (trial.possible_responses instanceof Array) {
			track_responses.push(trial.key_press)
			// if subject responded, record rt
			if (trial.key_press != -1) {
				track_rts.push(trial.rt)
			}
		}
		else if (trial.trial_type == 'single-stim-button') {
			track_responses.push(trial.mouse_click)
			if (trial.mouse_click != -1) {
				track_rts.push(trial.rt)
			}
		}

	}
	avg_rt = arraySum(track_rts)/track_rts.length
	return avg_rt
}
var getFeedback = function() {
	return '<div class = centerbox><p class = center-block-text>' + feedback_text + '</p></div>'
}

/* ************************************ */
/* Define experimental variables */
/* ************************************ */
var sumInstructTime = 0    //ms
var instructTimeThresh = 5   ///in seconds



var start_time = new Date();
var timelimit = 10

/* ************************************ */
/* Set up jsPsych blocks */
/* ************************************ */
/* define static blocks */
var welcome_block = {
  type: 'poldrack-text',
  text: '<div class = centerbox><p class = center-block-text>Welcome to the experiment. Press <strong>enter</strong> to begin.</p></div>',
  cont_key: [13],
  timing_response: 60000,
  timing_post_trial: 0
};

var end_block = {
  type: 'poldrack-text',
  text: '<div class = centerbox><p class = center-block-text>Thanks for completing this task!</p><p class = center-block-text>Press <strong>enter</strong> to continue.</p></div>',
  cont_key: [13],
  timing_response: 60000,
  timing_post_trial: 0
};

var feedback_text = 'Starting with instructions.  Press <strong> Enter </strong> to continue.'
var feedback_block = {
  type: 'poldrack-text',
  cont_key: [13],
  text: getFeedback,
  timing_post_trial: 0,
  timing_response: 6000
};


var instruction_trials = []
var instructions_block = {
  type: 'poldrack-instructions',
  pages: ['<div class = centerbox><p class = block-text>In this task we want you to write. On the next page write for ' + timelimit + 'minutes in response to the prompt "What happened in the last month?".</p><p class = block-text> It is important that you write for the entire time and stay on task. After you end the instructions you will start.</p></div>'],
  allow_keys: false,
  show_clickable_nav: true,
  timing_post_trial: 1000
};
instruction_trials.push(feedback_block)
instruction_trials.push(instructions_block)

var instruction_node = {
    timeline: instruction_trials,
	/* This function defines stopping criteria */
    loop_function: function(data){
		for(i=0;i<data.length;i++){
			if((data[i].trial_type=='poldrack-instructions') && (data[i].rt!=-1)){
				rt=data[i].rt
				sumInstructTime=sumInstructTime+rt
			}
		}
		console.log(sumInstructTime)
		if(sumInstructTime<=instructTimeThresh*1000){
			feedback_text = 'Read through instructions too quickly.  Please take your time and make sure you understand the instructions.  Press <strong>enter</strong> to continue.'
			return true
		} else if(sumInstructTime>instructTimeThresh*1000){
			feedback_text = 'Done with instructions. Press <strong>enter</strong> to continue.'
			return false
		}
    }
}


/* define test block */
var test_block = {
  type: 'writing',
  text_class: 'writing_class',
  is_html: true,
  data: {exp_id: "writing_task", trial_id: "test"},
  timing_post_trial: 0
};

var loop_node = {
    timeline: [test_block],
    loop_function: function(){
      var elapsed = (new Date() - start_time)/60000
        if(elapsed < timelimit){
            return true;
        } else {
            return false;
        }
    }
}

/* create experiment definition array */
var writing_task_experiment = [];
writing_task_experiment.push(welcome_block);
writing_task_experiment.push(instruction_node);
writing_task_experiment.push(loop_node);
writing_task_experiment.push(end_block);
