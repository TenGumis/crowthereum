App.contracts = {}
  
App.load = async () => {
  await App.loadWeb3()
  await App.loadAccount()
  await App.loadBulletinBoard()
  await App.loadContract()
  await App.render()
  await App.renderProjects()
}


App.renderProjects = async () => {
  // Load the total task count from the blockchain
  const taskCount = await App.projects.projectCount()
  const $projectTemplate = $('.projectTemplate')
  const $completedProjectTemplate = $('.completedProjectTemplate')
  const $expiredProjectTemplate = $('.expiredProjectTemplate')
  
      // Render out each task with a new task template
  for (var i = 0; i < taskCount; i++) {
    // Fetch the task data from the blockchain
    const project = await App.projects.projects(i)
    const projectHash = project[0].toNumber()
    const projectFromBulletin = App.bulletinBoard.projects.find(
                              (proj) => {
                                return proj.id == projectHash 
                              });

    try {
      const isProjectCompleted = await App.projects.isProjectCompleted(projectFromBulletin.id)
      const isProjectExpired = await App.isProjectExpired(projectFromBulletin.id)
      if (isProjectCompleted) {
        const $newCompletedProjectTemplate = $completedProjectTemplate.clone()
        $newCompletedProjectTemplate.find('.content').html(projectFromBulletin.title)
        $newCompletedProjectTemplate.find('input')
        $('#completedProjectList').append($newCompletedProjectTemplate)
        $newCompletedProjectTemplate.on('click', 'button', function(evt) {
          window.location.href = "/project-details.html?id=" + projectFromBulletin.id;          
        })
        $newCompletedProjectTemplate.show()
      } else if (isProjectExpired) {
        const $newExpiredProjectTemplate = $expiredProjectTemplate.clone()
        $newExpiredProjectTemplate.find('.content').html(projectFromBulletin.title)
        $newExpiredProjectTemplate.find('input')

        $('#expiredProjectList').append($newExpiredProjectTemplate)

        $newExpiredProjectTemplate.on('click', 'button', function(evt) {
          window.location.href = "/project-details.html?id=" + projectFromBulletin.id;          
        })
        $newExpiredProjectTemplate.show()
      } else {
        const $newProjectTemplate = $projectTemplate.clone()
        $newProjectTemplate.find('.content').html(projectFromBulletin.title)
        $newProjectTemplate.find('input')

        $('#projectList').append($newProjectTemplate)

        $newProjectTemplate.on('click', 'button', function(evt) {
          window.location.href = "/project-details.html?id=" + projectFromBulletin.id;          
        })
        $newProjectTemplate.show()
      }
    } 
    catch(error) {
      console.log(error)
    }
  }
}
  
$(() => {
  $(window).load(() => {
    App.load()
  })
})